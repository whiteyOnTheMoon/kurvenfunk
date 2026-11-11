import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../../../', import.meta.url);
const script = readFileSync(
  new URL('infrastructure/scripts/maintenance/dev-phase0-21-synthetic-cleanup.mjs', root),
  'utf8',
);
const shell = readFileSync(
  new URL('infrastructure/scripts/maintenance/dev-phase0-21-synthetic-cleanup.sh', root),
  'utf8',
);

describe('Phase 0-21 DEV-only synthetic data cleanup', () => {
  it('requires explicit DEV target, verified double backup and checked snapshot', () => {
    assert.match(script, /PHASE021_CLEANUP_TARGET/);
    assert.match(script, /PHASE021_TWO_VERIFIED_BACKUPS/);
    assert.match(script, /DEV_SNAPSHOT_CHANGED_OR_PROVENANCE_UNSAFE/);
    assert.match(script, /comments\.length !== 29/);
    assert.match(script, /accounts\.length !== 6/);
    assert.match(script, /articles\.length !== 2/);
    assert.match(script, /isolationLevel: 'Serializable'/);
    assert.match(shell, /EXPECTED_COMMIT/);
    assert.match(shell, /origin\/develop/);
    assert.match(shell, /flock -n 8/);
    assert.match(shell, /flock -n 9/);
    assert.match(shell, /flock -n 7/);
  });

  it('backs up and verifies both app and Keycloak databases before any write', () => {
    assert.match(shell, /for role in app keycloak/);
    assert.match(shell, /pg_dump/);
    assert.match(shell, /pg_restore --list/);
    assert.match(shell, /pg_restore --file \/dev\/null/);
    const plan = shell.indexOf('execute_audit plan NO');
    const backup = shell.indexOf('for role in app keycloak');
    const apply = shell.indexOf('execute_audit apply YES');
    assert.ok(plan > 0 && backup > plan && apply > backup);
    assert.match(shell, /PHASE021_CLEANUP_MODE/);
    assert.match(script, /mode === 'plan'/);
  });

  it('cleans only known accounts and archived seed articles, preserving real clubs and imports', () => {
    assert.match(script, /seed-neutral-user/);
    assert.match(script, /Phase17 Test EDITOR/);
    assert.match(script, /Phase19 Test MODERATOR/);
    assert.match(script, /seed-sturm-kader-update/);
    assert.match(script, /seed-cup-blau-weiss-rapid/);
    assert.match(script, /row\.status !== 'ARCHIVED'/);
    assert.match(script, /QA_IDENTITY_PROVENANCE_MISMATCH/);
    assert.match(script, /UNRECOGNIZED_QA_KEYCLOAK_ACCOUNT/);
    assert.match(script, /comments\.some/);
    assert.doesNotMatch(
      script,
      /\btx\.(?:club|provider|importJob|importRecord|rawPayload)\.delete/,
    );
  });

  it('preserves unrelated moderation records and removes comment dependencies before comments', () => {
    const audit = script.indexOf('tx.auditLog.deleteMany');
    const notifications = script.indexOf('tx.notification.deleteMany');
    const reports = script.indexOf('tx.moderationReport.deleteMany');
    const reactions = script.indexOf('tx.reaction.deleteMany');
    const comments = script.indexOf('tx.comment.deleteMany');
    const articles = script.indexOf('tx.article.deleteMany');
    const users = script.indexOf('tx.user.deleteMany');
    assert.ok(audit < reports && notifications < reports && reports < reactions);
    assert.ok(reactions < comments && comments < articles && articles < users);
    assert.match(script, /linkedCards !== 0/);
    assert.match(script, /row\._count\.sanctions !== 0/);
  });
});
