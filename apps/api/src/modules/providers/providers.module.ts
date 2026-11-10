import { Module } from '@nestjs/common';
import { FakeSportsProvider } from './fake-sports-provider';
import { SportsProviderRegistry } from './sports-provider.registry';

function createRegistry(fake: FakeSportsProvider): SportsProviderRegistry {
  const registry = new SportsProviderRegistry();

  // Never feed synthetic fixtures to a real provider pipeline by default.
  // Even an accidental production opt-in fails startup instead of registering.
  if (process.env.SPORTS_FAKE_PROVIDER_ENABLED === 'true') {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new Error('FAKE_SPORTS_FORBIDDEN_ENVIRONMENT');
    }
    registry.register(fake);
  }

  return registry;
}

@Module({
  providers: [
    { provide: FakeSportsProvider, useFactory: () => new FakeSportsProvider() },
    { provide: SportsProviderRegistry, inject: [FakeSportsProvider], useFactory: createRegistry },
  ],
  exports: [SportsProviderRegistry],
})
export class ProvidersModule {}
