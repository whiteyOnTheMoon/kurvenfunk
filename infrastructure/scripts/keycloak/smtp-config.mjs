import { readFileSync } from 'node:fs';

const ENVIRONMENTS = new Set(['dev', 'staging', 'prod']);
const MAILBOX = /^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@(?:[a-zA-Z0-9-]+\.)+at$/u;
const DNS_HOST =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/u;

function required(value, code) {
  if (typeof value !== 'string' || !value || /[\r\n\0]/u.test(value)) {
    throw new Error(code);
  }
  return value;
}

function mailbox(value, code) {
  const address = required(value, code);
  if (!MAILBOX.test(address) || !/@(?:[a-z0-9-]+\.)*kurvenfunk\.at$/iu.test(address)) {
    throw new Error(code);
  }
  return address;
}

export function parseEmailEnvironment(content) {
  const entries = {};
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(trimmed);
    if (!match) continue; // Other application environment variables are irrelevant.
    const [, name, rawValue] = match;
    if (!name.startsWith('MAIL_')) continue;
    if (Object.hasOwn(entries, name)) throw new Error('MAIL_ENV_DUPLICATE_KEY');
    let value = rawValue;
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    entries[name] = value;
  }
  return entries;
}

export function buildKeycloakEmailConfig(values, target) {
  if (!ENVIRONMENTS.has(target)) throw new Error('MAIL_ENVIRONMENT_INVALID');
  const from = mailbox(values.MAIL_FROM || 'no-reply@kurvenfunk.at', 'MAIL_FROM_INVALID');
  const replyTo = mailbox(values.MAIL_REPLY_TO || from, 'MAIL_REPLY_TO_INVALID');
  const fromDisplayName = required(values.MAIL_FROM_NAME || 'KURVENFUNK', 'MAIL_NAME_INVALID');
  if (fromDisplayName.length > 70) throw new Error('MAIL_NAME_TOO_LONG');

  const common = {
    from,
    fromDisplayName,
    replyTo,
    replyToDisplayName: fromDisplayName,
  };

  if (target === 'dev') {
    if (values.MAIL_TRANSPORT && values.MAIL_TRANSPORT !== 'mailpit') {
      throw new Error('MAIL_DEV_MUST_USE_MAILPIT');
    }
    return {
      smtpServer: {
        ...common,
        host: 'mailpit',
        port: '1025',
        auth: 'false',
        ssl: 'false',
        starttls: 'false',
      },
    };
  }

  if (values.MAIL_TRANSPORT === 'microsoft365') {
    // Keycloak 26.2+ XOAUTH2: client credentials, no mailbox password.
    // Exchange Application RBAC must restrict this app to the single mailbox.
    if (from.toLowerCase() !== 'noreply@kurvenfunk.at') {
      throw new Error('MAIL_M365_SENDER_INVALID');
    }
    if (values.MAIL_SMTP_PASSWORD || values.MAIL_SMTP_USERNAME) {
      throw new Error('MAIL_M365_BASIC_AUTH_FORBIDDEN');
    }
    const tenantId = required(values.MAIL_M365_TENANT_ID, 'MAIL_M365_TENANT_ID_MISSING');
    const clientId = required(values.MAIL_M365_CLIENT_ID, 'MAIL_M365_CLIENT_ID_MISSING');
    const clientSecret = required(
      values.MAIL_M365_CLIENT_SECRET,
      'MAIL_M365_CLIENT_SECRET_MISSING',
    );
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
    if (!uuidPattern.test(tenantId) || !uuidPattern.test(clientId)) {
      throw new Error('MAIL_M365_ID_INVALID');
    }
    if (clientSecret.length < 16 || clientSecret.includes(' ')) {
      throw new Error('MAIL_M365_CLIENT_SECRET_INVALID');
    }
    return {
      smtpServer: {
        ...common,
        host: 'smtp.office365.com',
        port: '587',
        auth: 'true',
        authType: 'token',
        ssl: 'false',
        starttls: 'true',
        user: from,
        authTokenUrl:
          'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token',
        authTokenScope: 'https://outlook.office365.com/.default',
        authTokenClientId: clientId,
        authTokenClientSecret: clientSecret,
      },
    };
  }

  if (values.MAIL_TRANSPORT !== 'smtp') {
    throw new Error('MAIL_PRODUCTION_PROVIDER_REQUIRED');
  }
  const host = required(values.MAIL_SMTP_HOST, 'MAIL_SMTP_HOST_MISSING');
  if (!DNS_HOST.test(host) || /^(?:localhost|mailpit)$/iu.test(host)) {
    throw new Error('MAIL_SMTP_HOST_INVALID');
  }
  const port = required(values.MAIL_SMTP_PORT, 'MAIL_SMTP_PORT_MISSING');
  const encryption = required(values.MAIL_SMTP_ENCRYPTION, 'MAIL_ENCRYPTION_REQUIRED');
  if (!(
    (port === '465' && encryption === 'ssl') ||
    (port === '587' && encryption === 'starttls')
  )) {
    throw new Error('MAIL_ENCRYPTION_REQUIRED');
  }
  const username = required(values.MAIL_SMTP_USERNAME, 'MAIL_SMTP_USERNAME_MISSING');
  const password = required(values.MAIL_SMTP_PASSWORD, 'MAIL_SMTP_PASSWORD_MISSING');
  if (password.length < 12) throw new Error('MAIL_SMTP_PASSWORD_TOO_SHORT');
  if (!values.MAIL_SMTP_HOST.includes('.')) throw new Error('MAIL_SMTP_HOST_INVALID');

  return {
    smtpServer: {
      ...common,
      host,
      port,
      auth: 'true',
      ssl: String(encryption === 'ssl'),
      starttls: String(encryption === 'starttls'),
      user: username,
      password,
    },
  };
}

export function auditKeycloakEmailConfig(realm, desired) {
  if (!realm || typeof realm !== 'object' || !realm.smtpServer) {
    throw new Error('MAIL_REALM_SMTP_MISSING');
  }
  const actual = realm.smtpServer;
  for (const [name, value] of Object.entries(desired.smtpServer)) {
    if (name === 'password' || name === 'authTokenClientSecret') continue; // Never read or print credentials.
    if (String(actual[name] ?? '') !== String(value)) {
      throw new Error('MAIL_REALM_CONFIG_MISMATCH');
    }
  }
  return true;
}

async function main() {
  const [command, file, target] = process.argv.slice(2);
  if (!['--validate', '--emit', '--audit'].includes(command) || !file) {
    throw new Error('MAIL_USAGE_INVALID');
  }
  const config = buildKeycloakEmailConfig(
    parseEmailEnvironment(readFileSync(file, 'utf8')),
    target,
  );
  if (command === '--validate') {
    console.log('KEYCLOAK_MAIL_CONFIG: VALID (' + target + ')');
  } else if (command === '--emit') {
    if (process.stdout.isTTY) throw new Error('MAIL_EMIT_REQUIRES_PIPE');
    // Secrets are deliberately written only to a closed CLI pipe.
    // NEVER invoke --emit interactively, redirect to logs, or use shell tracing.
    process.stdout.write(JSON.stringify(config) + '\n');
  } else {
    let incoming = '';
    for await (const chunk of process.stdin) {
      incoming += chunk;
      if (incoming.length > 2_000_000) throw new Error('MAIL_AUDIT_TOO_LARGE');
    }
    auditKeycloakEmailConfig(JSON.parse(incoming), config);
    console.log('KEYCLOAK_MAIL_REALM_READBACK: PASS (' + target + ')');
  }
}

if (process.argv[1]?.endsWith('/smtp-config.mjs')) {
  main().catch((error) => {
    const code = error instanceof Error ? error.message : 'MAIL_UNKNOWN_FAILURE';
    console.error(/^[A-Z_]{5,90}$/u.test(code) ? code : 'MAIL_UNKNOWN_FAILURE');
    process.exitCode = 1;
  });
}
