import { randomBytes } from 'node:crypto';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

// The new Task184 controller references AuthGuard; avoid the ESM-only jose
// import in this CommonJS dependency-injection unit test.
jest.mock('../auth/auth.guard', () => ({ AuthGuard: jest.fn() }));

import { BansModule } from './bans.module';
import { IpIdentityService } from './ip-identity.service';

// Prevent the ESM Prisma package from loading in CommonJS Jest unit suites.
jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('Task 181 – BansModule injection', () => {
  it('exports the HMAC identity service without enabling an IP enforcement guard', async () => {
    const secret = randomBytes(32).toString('base64url');
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), BansModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (name: string, fallback?: string) =>
          name === 'IP_HASH_HMAC_SECRET' ? secret : fallback,
      })
      .compile();

    try {
      const identity = moduleRef.get(IpIdentityService);
      expect(identity.isConfigured).toBe(true);
      const hashed = identity.hash('192.0.2.4');
      expect(hashed.hashKeyVersion).toBe('v1');
      expect(hashed.ipHash).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      await moduleRef.close();
    }
  });
});
