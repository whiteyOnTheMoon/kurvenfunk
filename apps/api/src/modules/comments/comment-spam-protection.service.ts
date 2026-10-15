import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_POSTS = 10;
const POST_COOLDOWN_MS = 5_000;
const DUPLICATE_WINDOW_MS = 300_000;
const MAX_LINKS = 2;

const RESERVE_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

local window = tonumber(ARGV[2])
local maximum = tonumber(ARGV[3])
local cooldown = tonumber(ARGV[4])
local duplicateWindow = tonumber(ARGV[5])

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)

if redis.call('EXISTS', KEYS[3]) == 1 then
  return 3
end

if redis.call('EXISTS', KEYS[2]) == 1 then
  return 2
end

if redis.call('ZCARD', KEYS[1]) >= maximum then
  return 1
end

redis.call('ZADD', KEYS[1], now, ARGV[1])
redis.call('PEXPIRE', KEYS[1], window)

redis.call('SET', KEYS[2], ARGV[1], 'PX', cooldown)
redis.call('SET', KEYS[3], ARGV[1], 'PX', duplicateWindow)

return 0
`;

const RELEASE_SCRIPT = `
redis.call('ZREM', KEYS[1], ARGV[1])

if redis.call('GET', KEYS[2]) == ARGV[1] then
  redis.call('DEL', KEYS[2])
end

if redis.call('GET', KEYS[3]) == ARGV[1] then
  redis.call('DEL', KEYS[3])
end

return 1
`;

export interface CommentSpamReservation {
  keys: [string, string, string];
  token: string;
}

@Injectable()
export class CommentSpamProtectionService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get<string>('REDIS_HOST', 'redis'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.getOrThrow<string>('REDIS_PASSWORD'),
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }

  validateLinks(body: string): void {
    const links =
      body.match(
        /(?:https?:\/\/|www\.)[^\s<>()]+|(?<![@\w])(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()]*)?/giu,
      ) ?? [];

    if (links.length > MAX_LINKS) {
      throw new BadRequestException({
        code: 'COMMENT_LINK_LIMIT',
        message: 'Pro Kommentar sind maximal zwei Links erlaubt.',
      });
    }
  }

  async reserve(authorId: string, body: string): Promise<CommentSpamReservation> {
    this.validateLinks(body);

    const normalizedBody = body.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();

    const bodyHash = createHash('sha256').update(normalizedBody).digest('hex');

    const prefix = `kurvenfunk:comments:spam:v1:${authorId}`;

    const keys: [string, string, string] = [
      `${prefix}:rate`,
      `${prefix}:cooldown`,
      `${prefix}:duplicate:${bodyHash}`,
    ];

    const token = randomUUID();

    let result: unknown;

    try {
      result = await this.redis.eval(
        RESERVE_SCRIPT,
        3,
        ...keys,
        token,
        RATE_WINDOW_MS,
        RATE_MAX_POSTS,
        POST_COOLDOWN_MS,
        DUPLICATE_WINDOW_MS,
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'COMMENT_SPAM_PROTECTION_UNAVAILABLE',
        message: 'Kommentieren ist vorübergehend nicht verfügbar.',
      });
    }

    if (result === 3) {
      throw new ConflictException({
        code: 'COMMENT_DUPLICATE_SPAM',
        message: 'Du hast diesen Kommentar vor Kurzem bereits veröffentlicht.',
      });
    }

    if (result === 2) {
      throw new HttpException(
        {
          code: 'COMMENT_POST_COOLDOWN',
          message: 'Bitte warte kurz, bevor du erneut kommentierst.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result === 1) {
      throw new HttpException(
        {
          code: 'COMMENT_RATE_LIMIT',
          message: 'Du hast zu viele Kommentare veröffentlicht. Bitte versuche es später erneut.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result !== 0) {
      throw new ServiceUnavailableException({
        code: 'COMMENT_SPAM_PROTECTION_UNAVAILABLE',
        message: 'Kommentieren ist vorübergehend nicht verfügbar.',
      });
    }

    return { keys, token };
  }

  async release(reservation: CommentSpamReservation): Promise<void> {
    await this.redis.eval(RELEASE_SCRIPT, 3, ...reservation.keys, reservation.token);
  }

  onModuleDestroy(): void {
    if (this.redis.status !== 'end') {
      this.redis.disconnect();
    }
  }
}
