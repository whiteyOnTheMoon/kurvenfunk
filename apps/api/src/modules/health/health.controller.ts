import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'kurvenfunk-api',
    };
  }

  @Get('live')
  getLiveness() {
    return {
      status: 'ok',
      service: 'kurvenfunk-api',
    };
  }

  @Get('ready')
  async getReadiness() {
    const result = await this.healthService.checkReadiness();

    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
