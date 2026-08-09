import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

@Injectable()
export class TestJobService implements OnModuleInit {
  private readonly logger = new Logger(TestJobService.name);

  constructor(
    @InjectQueue('test')
    private readonly testQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const runStartupTest =
      this.configService.get<string>('WORKER_RUN_STARTUP_TEST') === 'true';

    if (!runStartupTest) {
      return;
    }

    const job = await this.testQueue.add('startup-test', {
      message: 'Kurvenfunk BullMQ funktioniert',
    });

    this.logger.log(`Test job erstellt: id=${job.id}`);
  }
}
