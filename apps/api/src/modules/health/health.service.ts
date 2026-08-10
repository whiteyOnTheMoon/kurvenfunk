import { createPrismaClient } from '@kurvenfunk/database';
import {
  Injectable,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type CheckStatus = 'ok' | 'error';

interface ReadinessChecks {
  postgres: CheckStatus;
  redis: CheckStatus;
}

export interface ReadinessResult {
  status: 'ok' | 'error';
  service: 'kurvenfunk-api';
  checks: ReadinessChecks;
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly database = createPrismaClient();
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'redis'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password:
        this.configService.getOrThrow<string>('REDIS_PASSWORD'),
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 100, 1000),
    });
  }

  async checkReadiness(): Promise<ReadinessResult> {
    const [postgresResult, redisResult] = await Promise.allSettled([
      this.checkPostgres(),
      this.checkRedis(),
    ]);

    const checks: ReadinessChecks = {
      postgres:
        postgresResult.status === 'fulfilled' ? 'ok' : 'error',
      redis:
        redisResult.status === 'fulfilled' ? 'ok' : 'error',
    };

    const ready =
      checks.postgres === 'ok' &&
      checks.redis === 'ok';

    return {
      status: ready ? 'ok' : 'error',
      service: 'kurvenfunk-api',
      checks,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();

    if (this.redis.status !== 'end') {
      this.redis.disconnect();
    }
  }

  private async checkPostgres(): Promise<void> {
    await this.database.$queryRawUnsafe('SELECT 1');
  }

  private async checkRedis(): Promise<void> {
    const response = await this.redis.ping();

    if (response !== 'PONG') {
      throw new Error('Unexpected Redis PING response');
    }
  }
}
