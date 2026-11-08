import { createServer, request as proxyRequest } from 'node:http';
import { lookup } from 'node:dns/promises';

import Redis from 'ioredis';

import {
  AUTH_LIMITS,
  classifyAuthRequest,
  COUNTER_LUA,
  rateKey,
  safeUpstreamHeaders,
  verifiedClientIp,
} from './policy';

const port = Number(process.env.AUTH_GATEWAY_PORT || 8080);
const redisPassword = process.env.REDIS_PASSWORD;
const identitySecret = process.env.IP_HASH_HMAC_SECRET;
const upstream = process.env.AUTH_GATEWAY_UPSTREAM || 'keycloak';
const expectedHost = 'auth-dev.kurvenfunk.at';

if (
  !Number.isInteger(port) ||
  port < 1024 ||
  port > 65535 ||
  !redisPassword ||
  !identitySecret ||
  upstream !== 'keycloak'
) {
  throw new Error('AUTH_GATEWAY_CONFIGURATION_INVALID');
}

// The gateway is optional. It must never be routed into production automatically.
// A missing tunnel peer, HMAC secret or Redis connection is a hard refusal.
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: redisPassword,
  lazyConnect: false,
  connectTimeout: 1500,
  maxRetriesPerRequest: 1,
  // Requests fail immediately during outages; reconnect in the background.
  // A disabled retry strategy would leave the gateway at 503 after Redis returns.
  enableOfflineQueue: false,
  retryStrategy: (attempt) => Math.min(attempt * 100, 1000),
});

function reject(response: import('node:http').ServerResponse, status: number): void {
  response.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(status === 429 ? 'Too many requests' : 'Service unavailable');
}

async function handleRequest(
  incoming: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
): Promise<void> {
  if (incoming.url === '/_gateway/health' && incoming.method === 'GET') {
    const peer = incoming.socket.remoteAddress;
    if (peer !== '127.0.0.1' && peer !== '::1' && peer !== '::ffff:127.0.0.1') {
      reject(response, 503);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('ok');
    return;
  }

  let pathname: string;
  try {
    pathname = new URL(incoming.url || '/', 'https://' + expectedHost).pathname;
    // Do not allow alternate encodings that could be decoded differently by Keycloak.
    // Only the query string (OIDC codes, sessions) may contain percent escapes.
    if (pathname.startsWith('/realms/') && pathname.includes('%')) {
      reject(response, 503);
      return;
    }
  } catch {
    reject(response, 503);
    return;
  }

  // Check TCP peer, not headers alone. Never pass untrusted forwarded headers to Keycloak.
  let peers: string[];
  try {
    peers = (await lookup('cloudflared', { all: true })).map((item) => item.address);
  } catch {
    reject(response, 503);
    return;
  }

  const clientIp = verifiedClientIp(
    incoming.socket.remoteAddress,
    incoming.headers['cf-connecting-ip'],
    peers,
  );

  if (!clientIp || incoming.headers.host !== expectedHost) {
    reject(response, 503);
    return;
  }

  const action = classifyAuthRequest(incoming.method || '', pathname);
  if (action) {
    try {
      const quota = AUTH_LIMITS[action];
      const digest = rateKey(clientIp, identitySecret ?? '');
      const key = 'kurvenfunk:auth-gateway:v1:' + action + ':' + digest;
      const count: unknown = await redis.eval(COUNTER_LUA, 1, key, quota.windowMs);
      if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1) {
        reject(response, 503);
        return;
      }
      if (count > quota.requests) {
        reject(response, 429);
        return;
      }
    } catch {
      reject(response, 503);
      return;
    }
  }

  const headers = safeUpstreamHeaders(incoming.headers, clientIp, expectedHost);

  const upstreamRequest = proxyRequest(
    {
      hostname: upstream,
      port: 8080,
      method: incoming.method,
      path: incoming.url,
      headers,
      timeout: 15_000,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstreamRequest.on('timeout', () => upstreamRequest.destroy());
  upstreamRequest.on('error', () => {
    if (!response.headersSent) reject(response, 503);
    else response.destroy();
  });

  incoming.pipe(upstreamRequest);
}

const server = createServer((incoming, response) => {
  void handleRequest(incoming, response).catch(() => {
    if (!response.headersSent) reject(response, 503);
    else response.destroy();
  });
});

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
});

server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;

server.listen(port, '0.0.0.0', () => {
  console.log('AUTH_GATEWAY_DEV_READY');
});

const stop = (): void => {
  server.close();
  redis.disconnect();
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
