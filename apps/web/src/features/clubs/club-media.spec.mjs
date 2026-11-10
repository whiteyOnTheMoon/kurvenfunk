import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getClubLogoSrc } from './club-media.ts';

describe('real club logos', () => {
  const apiUrl = 'https://api-dev.kurvenfunk.at/';

  it('serves stored media by its public id rather than leaking its storage key', () => {
    const src = getClubLogoSrc(apiUrl, {
      slug: 'sk-rapid-wien',
      logo: {
        id: 'e7ca160d-43b9-49a0-9246-9b5037f200c9',
        storageKey: 'private/club/a.png',
        externalUrl: 'https://example.invalid/logo.png',
      },
    });
    assert.equal(
      src,
      'https://api-dev.kurvenfunk.at/api/v1/media/e7ca160d-43b9-49a0-9246-9b5037f200c9/content',
    );
    assert.ok(!src.includes('private/club/'));
  });

  it('uses the configured external image URL only for safe HTTP(S) media', () => {
    assert.equal(
      getClubLogoSrc(apiUrl, {
        slug: 'club-without-static-asset',
        logo: {
          id: 'a',
          storageKey: null,
          externalUrl: 'https://cdn.example.test/logo.svg',
        },
      }),
      'https://cdn.example.test/logo.svg',
    );
  });

  it('falls back to shipped logos without guessing paths for unknown clubs', () => {
    assert.equal(
      getClubLogoSrc(apiUrl, { slug: 'sk-sturm-graz', logo: null }),
      '/clubs/sk-sturm-graz.svg',
    );
    assert.equal(getClubLogoSrc(apiUrl, { slug: 'new-club', logo: null }), null);
    assert.equal(
      getClubLogoSrc(apiUrl, {
        slug: 'new-club',
        logo: { id: 'a', storageKey: null, externalUrl: 'javascript:alert(1)' },
      }),
      null,
    );
  });
});
