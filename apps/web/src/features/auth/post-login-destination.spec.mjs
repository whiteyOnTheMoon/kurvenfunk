import assert from 'node:assert/strict';
import test from 'node:test';

import { getPostLoginDestination } from './post-login-destination.ts';

const identity = (roles, status = 'ACTIVE', onboardingCompleted = true) => ({
  roles,
  status,
  onboardingCompleted,
});

test('completed community accounts land on the portal homepage', () => {
  for (const roles of [[], ['USER'], ['TRUSTED_USER']]) {
    assert.equal(getPostLoginDestination(identity(roles)), '/');
  }
  assert.equal(getPostLoginDestination(identity(['USER'], 'LIMITED')), '/');
});

test('unfinished onboarding always takes priority over admin redirection', () => {
  for (const roles of [['USER'], ['EDITOR'], ['MODERATOR'], ['SUPERADMIN']]) {
    assert.equal(getPostLoginDestination(identity(roles, 'ACTIVE', false)), '/onboarding');
  }
});

test('staff land in an authorized workspace matching their roles', () => {
  assert.equal(getPostLoginDestination(identity(['EDITOR'])), '/admin/artikel');
  assert.equal(getPostLoginDestination(identity(['MODERATOR'])), '/admin/moderation');
  assert.equal(getPostLoginDestination(identity(['ADMIN'])), '/admin');
  assert.equal(getPostLoginDestination(identity(['SUPERADMIN'])), '/admin');
  assert.equal(getPostLoginDestination(identity(['USER', 'MODERATOR'])), '/admin/moderation');
  assert.equal(getPostLoginDestination(identity(['EDITOR', 'MODERATOR'])), '/admin/artikel');
});

test('restricted staff never get an admin landing route', () => {
  assert.equal(getPostLoginDestination(identity(['EDITOR'], 'LIMITED')), '/');
  assert.equal(getPostLoginDestination(identity(['MODERATOR'], 'BANNED')), '/');
  assert.equal(getPostLoginDestination(identity(['ADMIN'], 'BANNED')), '/');
});
