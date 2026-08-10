import 'reflect-metadata';
import { createLogger } from '@kurvenfunk/logger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = createLogger({
  service: 'worker',
});

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  logger.info('Worker started', {
    event: 'worker.started',
  });
}

void bootstrap().catch((error: unknown) => {
  logger.error('Worker failed to start', {
    event: 'worker.start.failed',
    metadata: {
      error,
    },
  });

  process.exitCode = 1;
});
