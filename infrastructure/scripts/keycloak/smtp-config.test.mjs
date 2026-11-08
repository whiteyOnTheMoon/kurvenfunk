import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auditKeycloakEmailConfig,
  buildKeycloakEmailConfig,
  parseEmailEnvironment,
} from './smtp-config.mjs';

const smtp = {
  MAIL_TRANSPORT: 'smtp',
  MAIL_SMTP_HOST: 'smtp.example.net',
  MAIL_SMTP_PORT: '465',
  MAIL_SMTP_ENCRYPTION: 'ssl',
  MAIL_SMTP_USERNAME: 'smtp-user',
  MAIL_SMTP_PASSWORD: 'private-test-only-not-real-secret',
  MAIL_FROM: 'no-reply@kurvenfunk.at',
  MAIL_FROM_NAME: 'KURVENFUNK',
  MAIL_REPLY_TO: 'support@kurvenfunk.at',
};

test('DEV always uses isolated Mailpit with no credentials', () => {
  const config = buildKeycloakEmailConfig({}, 'dev');
  assert.deepEqual(config.smtpServer, {
    from: 'no-reply@kurvenfunk.at',
    fromDisplayName: 'KURVENFUNK',
    replyTo: 'no-reply@kurvenfunk.at',
    replyToDisplayName: 'KURVENFUNK',
    host: 'mailpit',
    port: '1025',
    auth: 'false',
    ssl: 'false',
    starttls: 'false',
  });
  assert.throws(
    () => buildKeycloakEmailConfig({ MAIL_TRANSPORT: 'smtp' }, 'dev'),
    /MAIL_DEV_MUST_USE_MAILPIT/u,
  );
});

test('STAGING and PROD both require authenticated encrypted SMTP', () => {
  for (const env of ['staging', 'prod']) {
    const config = buildKeycloakEmailConfig(smtp, env);
    assert.equal(config.smtpServer.host, 'smtp.example.net');
    assert.equal(config.smtpServer.auth, 'true');
    assert.equal(config.smtpServer.ssl, 'true');
    assert.equal(config.smtpServer.starttls, 'false');
    assert.equal(config.smtpServer.password, smtp.MAIL_SMTP_PASSWORD);
    assert.equal(config.smtpServer.replyTo, 'support@kurvenfunk.at');
    const { password: _redacted, ...sanitized } = config.smtpServer;
    assert.equal(auditKeycloakEmailConfig({ smtpServer: sanitized }, config), true);
    assert.throws(
      () => auditKeycloakEmailConfig({ smtpServer: { ...sanitized, host: 'mailpit' } }, config),
      /MAIL_REALM_CONFIG_MISMATCH/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...smtp, MAIL_TRANSPORT: 'mailpit' }, env),
      /MAIL_PRODUCTION_PROVIDER_REQUIRED/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...smtp, MAIL_SMTP_PORT: '25' }, env),
      /MAIL_ENCRYPTION_REQUIRED/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...smtp, MAIL_SMTP_HOST: 'localhost' }, env),
      /MAIL_SMTP_HOST_INVALID/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...smtp, MAIL_SMTP_PASSWORD: '' }, env),
      /MAIL_SMTP_PASSWORD_MISSING/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...smtp, MAIL_FROM: 'spoof@other.example.com' }, env),
      /MAIL_FROM_INVALID/u,
    );
    const tls = buildKeycloakEmailConfig(
      { ...smtp, MAIL_SMTP_PORT: '587', MAIL_SMTP_ENCRYPTION: 'starttls' },
      env,
    );
    assert.equal(tls.smtpServer.starttls, 'true');
    assert.equal(tls.smtpServer.ssl, 'false');
  }
});

test('Exchange Online uses scoped app OAuth2 and no mailbox password', () => {
  const settings = {
    MAIL_TRANSPORT: 'microsoft365',
    MAIL_FROM: 'noreply@kurvenfunk.at',
    MAIL_FROM_NAME: 'KURVENFUNK',
    MAIL_M365_TENANT_ID: '11111111-1111-4111-8111-111111111111',
    MAIL_M365_CLIENT_ID: '22222222-2222-4222-8222-222222222222',
    MAIL_M365_CLIENT_SECRET: 'private-only-fixture-not-a-real-secret',
  };
  for (const env of ['staging', 'prod']) {
    const config = buildKeycloakEmailConfig(settings, env);
    assert.deepEqual(config.smtpServer, {
      from: 'noreply@kurvenfunk.at',
      fromDisplayName: 'KURVENFUNK',
      replyTo: 'noreply@kurvenfunk.at',
      replyToDisplayName: 'KURVENFUNK',
      host: 'smtp.office365.com',
      port: '587',
      auth: 'true',
      authType: 'token',
      ssl: 'false',
      starttls: 'true',
      user: 'noreply@kurvenfunk.at',
      authTokenUrl:
        'https://login.microsoftonline.com/11111111-1111-4111-8111-111111111111/oauth2/v2.0/token',
      authTokenScope: 'https://outlook.office365.com/.default',
      authTokenClientId: '22222222-2222-4222-8222-222222222222',
      authTokenClientSecret: settings.MAIL_M365_CLIENT_SECRET,
    });
    const { authTokenClientSecret: _redacted, ...readback } = config.smtpServer;
    assert.equal(auditKeycloakEmailConfig({ smtpServer: readback }, config), true);
    assert.throws(
      () => auditKeycloakEmailConfig({
        smtpServer: { ...readback, authTokenScope: 'https://graph.microsoft.com/.default' },
      }, config),
      /MAIL_REALM_CONFIG_MISMATCH/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...settings, MAIL_FROM: 'no-reply@kurvenfunk.at' }, env),
      /MAIL_M365_SENDER_INVALID/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...settings, MAIL_SMTP_PASSWORD: 'somepassword' }, env),
      /MAIL_M365_BASIC_AUTH_FORBIDDEN/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...settings, MAIL_M365_TENANT_ID: 'common' }, env),
      /MAIL_M365_ID_INVALID/u,
    );
    assert.throws(
      () => buildKeycloakEmailConfig({ ...settings, MAIL_M365_CLIENT_SECRET: '' }, env),
      /MAIL_M365_CLIENT_SECRET_MISSING/u,
    );
  }
  assert.throws(
    () => buildKeycloakEmailConfig(settings, 'dev'),
    /MAIL_DEV_MUST_USE_MAILPIT/u,
  );
});

test('mail config parsing supports private quoted values and rejects duplicates', () => {
  const parsed = parseEmailEnvironment(
    '# ignored\nMAIL_SMTP_PASSWORD="secret=kept#exactly"\nMAIL_FROM=no-reply@kurvenfunk.at\nOTHER_PASSWORD=not-relevant\n',
  );
  assert.equal(parsed.MAIL_SMTP_PASSWORD, 'secret=kept#exactly');
  assert.equal(parsed.MAIL_FROM, 'no-reply@kurvenfunk.at');
  assert.equal(Object.keys(parsed).length, 2);
  assert.throws(
    () => parseEmailEnvironment('MAIL_FROM=x\nMAIL_FROM=y\n'),
    /MAIL_ENV_DUPLICATE_KEY/u,
  );
});

test('rejects hostname injection, non-KURVENFUNK senders and unencrypted mail', () => {
  for (const changes of [
    { MAIL_SMTP_HOST: 'bad host' },
    { MAIL_SMTP_HOST: 'mailpit' },
    { MAIL_SMTP_HOST: 'smtp.example.net\nX-Evil: injected' },
    { MAIL_SMTP_PORT: '587', MAIL_SMTP_ENCRYPTION: 'ssl' },
    { MAIL_SMTP_PORT: '465', MAIL_SMTP_ENCRYPTION: 'starttls' },
    { MAIL_FROM: 'no-reply@kurvenfunk.at\nBcc: bad@example.net' },
    { MAIL_REPLY_TO: 'attacker@example.net' },
    { MAIL_FROM_NAME: '\nBad header' },
  ]) {
    assert.throws(() => buildKeycloakEmailConfig({ ...smtp, ...changes }, 'prod'));
  }
});
