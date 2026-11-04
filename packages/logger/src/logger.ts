import type {
  CreateLoggerOptions,
  LogEntry,
  LogFormat,
  LogLevel,
  LogMetadata,
  LogOptions,
  LogSink,
  Logger,
} from './types.js';

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'clientSecret',
  'client_secret',
  'apiKey',
  'api_key',
] as const;

const sensitiveKeys = new Set(SENSITIVE_KEYS.map((key) => key.toLowerCase()));

const INLINE_SECRET_PATTERN =
  /((?:["']?)(?:access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|password|passwd|api[_-]?key|client[_-]?secret|secret|set-cookie|cookie|code|app)(?:["']?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s&;,}]+)/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;

export function redactSensitiveText(text: string): string {
  return text
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(INLINE_SECRET_PATTERN, '$1[REDACTED]');
}


function isSensitiveKey(key: string): boolean {
  return sensitiveKeys.has(key.toLowerCase());
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
      stack: value.stack ? redactSensitiveText(value.stack) : undefined,
    };
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeMetadata(value as Record<string, unknown>);
  }

  return value;
}

export function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? REDACTED : sanitizeValue(value),
    ]),
  );
}

export function createLogEntry(
  service: string,
  level: LogLevel,
  message: string,
  options: LogOptions = {},
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service,
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.event ? { event: options.event } : {}),
    message: redactSensitiveText(message),
    ...(options.metadata ? { metadata: sanitizeMetadata(options.metadata) } : {}),
  };
}

function formatPretty(entry: LogEntry): string {
  const parts = [entry.timestamp, entry.level.toUpperCase().padEnd(5), `[${entry.service}]`];

  if (entry.requestId) {
    parts.push(`[request:${entry.requestId}]`);
  }

  if (entry.userId) {
    parts.push(`[user:${entry.userId}]`);
  }

  if (entry.event) {
    parts.push(entry.event);
  }

  parts.push(entry.message);

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    parts.push(JSON.stringify(entry.metadata));
  }

  return parts.join(' ');
}

function createConsoleSink(format: LogFormat): LogSink {
  return (entry) => {
    const output = format === 'pretty' ? formatPretty(entry) : JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  };
}

export function resolveLogFormat(nodeEnv = process.env.NODE_ENV): LogFormat {
  return nodeEnv === 'development' ? 'pretty' : 'json';
}

export function createLogger({
  service,
  format = resolveLogFormat(),
  sink,
}: CreateLoggerOptions): Logger {
  const targetSink = sink ?? createConsoleSink(format);

  const write = (level: LogLevel, message: string, options?: LogOptions): void => {
    targetSink(createLogEntry(service, level, message, options));
  };

  return {
    debug: (message, options) => write('debug', message, options),
    info: (message, options) => write('info', message, options),
    warn: (message, options) => write('warn', message, options),
    error: (message, options) => write('error', message, options),
  };
}
