import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestJobService } from './jobs/test-job.service';
import { TestProcessor } from './processors/test.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    BullModule.registerQueue({
      name: 'test',
    }),
  ],
  providers: [TestProcessor, TestJobService],
})
export class AppModule {}
