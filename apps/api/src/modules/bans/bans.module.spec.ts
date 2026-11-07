import { randomBytes } from 'node:crypto';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { BansModule } from './bans.module';
import { IpIdentityService } from './ip-identity.service';

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
      expect(identity.hash('192.0.2.4')).toMatchObject({
        hashKeyVersion: 'v1',
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
    } finally {
      await moduleRef.close();
    }
  });
});
