import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAccessAdminPath,
  canEnterAdmin,
  getAdminNavigation,
  getAdminMenuDestination,
  getPostLoginDestination,
} from './admin-access.ts';

const identity = (roles, status = 'ACTIVE', onboardingCompleted = true) => ({
  roles,
  status,
  onboardingCompleted,
});

test('anonymous and ordinary community accounts never enter /admin', () => {
  assert.equal(canEnterAdmin(undefined), false);
  assert.equal(canEnterAdmin(identity(['USER'])), false);
  assert.equal(canEnterAdmin(identity(['TRUSTED_USER'])), false);

  for (const user of [undefined, identity(['USER']), identity(['TRUSTED_USER'])]) {
    for (const path of ['/admin', '/admin/artikel', '/admin/moderation', '/admin/system']) {
      assert.equal(canAccessAdminPath(user, path), false, path);
    }
    assert.deepEqual(getAdminNavigation(user), []);
  }
});

test('inactive, restricted or not-onboarded users cannot enter even with privileged roles', () => {
  for (const user of [
    identity(['EDITOR'], 'LIMITED'),
    identity(['ADMIN'], 'BANNED'),
    identity(['SUPERADMIN'], 'ACTIVE', false),
    identity([], 'ACTIVE'),
  ]) {
    assert.equal(canEnterAdmin(user), false);
    assert.equal(canAccessAdminPath(user, '/admin/artikel'), false);
    assert.deepEqual(getAdminNavigation(user), []);
  }
});

test('editors see editorial sections but not moderation or system management', () => {
  const editor = identity(['EDITOR']);
  for (const path of [
    '/admin',
    '/admin/artikel',
    '/admin/artikel/neu',
    '/admin/artikel/00000000-0000-4000-a000-000000000000',
    '/admin/kategorien',
    '/admin/tags',
    '/admin/medien',
    '/admin/importe',
  ]) {
    assert.equal(canAccessAdminPath(editor, path), true, path);
  }
  for (const path of [
    '/admin/moderation',
    '/admin/forum',
    '/admin/benutzer',
    '/admin/system',
    '/admin/sportdaten',
  ]) {
    assert.equal(canAccessAdminPath(editor, path), false, path);
  }
  assert.deepEqual(
    getAdminNavigation(editor).map((entry) => entry.href),
    [
      '/admin',
      '/admin/artikel',
      '/admin/kategorien',
      '/admin/tags',
      '/admin/medien',
      '/admin/importe',
    ],
  );
});

test('moderators only enter moderation and forum sections', () => {
  const moderator = identity(['MODERATOR']);
  for (const path of ['/admin', '/admin/moderation', '/admin/moderation/reports', '/admin/forum']) {
    assert.equal(canAccessAdminPath(moderator, path), true, path);
  }
  for (const path of ['/admin/artikel', '/admin/importe', '/admin/benutzer']) {
    assert.equal(canAccessAdminPath(moderator, path), false, path);
  }
  assert.deepEqual(
    getAdminNavigation(moderator).map((entry) => entry.href),
    ['/admin', '/admin/moderation', '/admin/forum'],
  );
});

test('administrators and superadministrators see all registered admin sections', () => {
  for (const role of ['ADMIN', 'SUPERADMIN']) {
    const user = identity([role]);
    for (const link of getAdminNavigation(user)) {
      assert.equal(canAccessAdminPath(user, link.href), true, link.href);
    }
    assert.equal(getAdminNavigation(user).length, 11);
  }
});

test('unknown admin routes and lookalike prefixes are rejected', () => {
  const admin = identity(['SUPERADMIN']);
  for (const path of ['/adminfoo', '/adminish', '/admin/not-a-section', '/admin/artikelboese']) {
    assert.equal(canAccessAdminPath(admin, path), false, path);
  }
  assert.equal(canAccessAdminPath(admin, '/admin/'), true);
});

test('combined roles use the union of privileges', () => {
  const user = identity(['EDITOR', 'MODERATOR']);
  assert.equal(canAccessAdminPath(user, '/admin/artikel'), true);
  assert.equal(canAccessAdminPath(user, '/admin/moderation'), true);
  assert.equal(canAccessAdminPath(user, '/admin/system'), false);
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

test('profile menu exposes admin only to active, onboarded staff', () => {
  for (const roles of [[], ['USER'], ['TRUSTED_USER']]) {
    assert.equal(getAdminMenuDestination(identity(roles)), null);
  }
  assert.equal(getAdminMenuDestination(undefined), null);
  assert.equal(getAdminMenuDestination(identity(['ADMIN'], 'LIMITED')), null);
  assert.equal(getAdminMenuDestination(identity(['MODERATOR'], 'ACTIVE', false)), null);
  assert.equal(getAdminMenuDestination(identity(['MODERATOR'])), '/admin/moderation');
  assert.equal(getAdminMenuDestination(identity(['EDITOR'])), '/admin/artikel');
  assert.equal(getAdminMenuDestination(identity(['SUPERADMIN'])), '/admin');
});
