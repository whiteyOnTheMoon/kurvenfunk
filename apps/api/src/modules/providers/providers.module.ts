import { Module } from '@nestjs/common';
import { SportsProviderRegistry } from './sports-provider.registry';

@Module({
  providers: [SportsProviderRegistry],
  exports: [SportsProviderRegistry],
})
export class ProvidersModule {}
