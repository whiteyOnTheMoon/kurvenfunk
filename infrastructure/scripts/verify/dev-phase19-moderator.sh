#!/usr/bin/env bash
# DEV-only Phase 19: inspect or provision one isolated MODERATOR test user.
# Usage: bash infrastructure/scripts/verify/dev-phase19-moderator.sh inspect|provision
# Credentials are stored only in a private (0600) file on the calling VPS user.
set -Eeuo pipefail
set +x
umask 077

if [[ "$#" -ne 1 || ( "$1" != inspect && "$1" != provision ) ]]; then
  echo "Usage: $0 inspect|provision" >&2
  exit 2
fi
mode="$1"
cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(git branch --show-current)" != develop || ! -f .env.dev ]]; then
  echo "ERROR: Requires the DEV develop checkout and .env.dev." >&2
  exit 1
fi
if [[ -v EXPECTED_COMMIT ]] && [[ "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: Checked out commit differs from EXPECTED_COMMIT." >&2
  exit 1
fi

vault="$HOME/.local/share/kurvenfunk"
echo "=== Phase 19 DEV accounts: $mode ==="
if [[ -d "$vault" ]]; then
  find "$vault" -maxdepth 1 -type f -name 'phase19-dev-moderator-*' \
    -printf 'Existing account artifact: %f (%s bytes)\n'
fi

if [[ "$mode" == provision ]]; then
  if [[ -d "$vault" ]] && compgen -G "$vault/phase19-dev-moderator-*" >/dev/null; then
    echo "ERROR: Existing account artifact. Run inspect before retrying." >&2
    exit 1
  fi
  mkdir -p "$vault"
  chmod 700 "$vault"
  output="$(mktemp "$vault/phase19-dev-moderator-stage-XXXXXXXX")"
  trap 'rm -f "$output"' EXIT
else
  output=/dev/stdout
fi

if ! docker compose \
  -p kurvenfunk-dev \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  exec -T api node --input-type=module - "$mode" >"$output" <<'JS'
import { randomBytes } from 'node:crypto';
import { createPrismaClient } from '@kurvenfunk/database';

const mode = process.argv[2];
const db = createPrismaClient();
const created = [];
let token;

const base = process.env.KEYCLOAK_ADMIN_INTERNAL_URL;
const realm = process.env.KEYCLOAK_REVOKER_REALM;
const clientId = process.env.KEYCLOAK_REVOKER_CLIENT_ID;
const clientSecret = process.env.KEYCLOAK_REVOKER_CLIENT_SECRET;

async function admin(method, path, payload) {
  return fetch(new URL('/admin/realms/' + realm + path, base), {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(15000),
  });
}

async function main() {
  if (
    !base || !realm || !clientId || !clientSecret ||
    new URL(base).hostname !== 'keycloak' ||
    new URL(base).protocol !== 'http:' ||
    realm !== 'kurvenfunk' ||
    new URL(process.env.DATABASE_URL ?? '').hostname !== 'postgres'
  ) {
    throw new Error('DEV_ENVIRONMENT_CHECK_FAILED');
  }

  const response = await fetch(
    new URL('/realms/' + realm + '/protocol/openid-connect/token', base), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error('KEYCLOAK_ADMIN_AUTH_FAILED');
  token = (await response.json()).access_token;
  if (!token) throw new Error('KEYCLOAK_ADMIN_TOKEN_MISSING');

  const listResponse = await admin('GET', '/users?search=kf-p19-&max=1000');
  if (!listResponse.ok) throw new Error('KEYCLOAK_USER_LIST_FAILED');
  const matches = (await listResponse.json()).filter(
    (user) => typeof user.username === 'string' &&
      user.username.startsWith('kf-p19-'),
  );
  const dbMatches = await db.user.count({
    where: { nickname: { startsWith: 'Phase19 Test ' } },
  });

  if (mode === 'inspect') {
    console.log('Keycloak Phase-19 accounts:', matches.length);
    console.log('Application Phase-19 accounts:', dbMatches);
    console.log('Existing application users:', await db.user.count());
    console.log('Credentials or tokens displayed: NO');
    console.log(
      matches.length || dbMatches
        ? 'PHASE 19 ACCOUNT INSPECT: EXISTING RECORDS (review first)'
        : 'PHASE 19 ACCOUNT INSPECT: NO MATCHING RECORDS',
    );
    return;
  }
  if (matches.length || dbMatches) {
    throw new Error('EXISTING_PHASE19_ACCOUNTS_REFUSE_DUPLICATES');
  }

  const suffix = randomBytes(8).toString('hex');
  for (const entry of [
    { kind: 'moderator', role: 'MODERATOR' },
  ]) {
    const username = 'kf-p19-' + entry.kind + '-' + suffix + '@example.test';
    const password = randomBytes(32).toString('base64url');
    const createResponse = await admin('POST', '/users', {
      username,
      email: username,
      firstName: 'Kurvenfunk',
      lastName: 'Phase19 ' + entry.kind,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    });
    if (createResponse.status !== 201) {
      throw new Error('CREATE_' + entry.role + '_HTTP_' + createResponse.status);
    }

    const location = createResponse.headers.get('location');
    let id = location?.match(/\/users\/([a-f0-9-]{36})$/i)?.[1];
    if (!id) {
      const lookup = await admin(
        'GET', '/users?username=' + encodeURIComponent(username) + '&exact=true',
      );
      if (!lookup.ok) throw new Error('CREATED_USER_LOOKUP_FAILED');
      const found = (await lookup.json()).filter((user) => user.username === username);
      if (found.length !== 1) throw new Error('CREATED_USER_ID_UNAVAILABLE');
      id = found[0].id;
    }
    created.push({ id, username, password, role: entry.role });

    const reset = await admin('PUT', '/users/' + id + '/reset-password', {
      type: 'password',
      value: password,
      temporary: false,
    });
    if (reset.status !== 204) {
      throw new Error('PASSWORD_SETUP_' + entry.role + '_HTTP_' + reset.status);
    }

    const verification = await admin('GET', '/users/' + id);
    if (!verification.ok) throw new Error('KEYCLOAK_USER_READ_FAILED');
    const identity = await verification.json();
    if (
      identity.enabled !== true || identity.emailVerified !== true ||
      (identity.requiredActions ?? []).length !== 0
    ) {
      throw new Error('KEYCLOAK_IDENTITY_NOT_READY');
    }
  }

  await db.$transaction(
    created.map((entry) => db.user.create({
      data: {
        keycloakSubject: entry.id,
        nickname: 'Phase19 Test ' + entry.role,
        status: 'ACTIVE',
        fanPreference: 'NEUTRAL',
        onboardingCompleted: true,
        roleAssignments: { create: { role: entry.role } },
      },
    })),
  );

  const stored = await db.user.findMany({
    where: { keycloakSubject: { in: created.map((entry) => entry.id) } },
    include: { roleAssignments: true },
  });
  if (stored.length !== 1 || created.some((entry) => {
    const user = stored.find((item) => item.keycloakSubject === entry.id);
    return !user || user.status !== 'ACTIVE' ||
      user.onboardingCompleted !== true ||
      user.roleAssignments.length !== 1 ||
      user.roleAssignments[0].role !== entry.role;
  })) {
    throw new Error('APPLICATION_ROLE_VERIFICATION_FAILED');
  }

  // stdout is redirected by the VPS shell to a private file, never the terminal.
  process.stdout.write(JSON.stringify({
    environment: 'DEV',
    purpose: 'PHASE_19_ACCEPTANCE',
    createdAt: new Date().toISOString(),
    accounts: created,
  }, null, 2) + '\n');
}

try {
  await main();
} catch (error) {
  console.error(
    'PHASE 19 ACCOUNT ' + mode.toUpperCase() + ' FAILED:',
    error instanceof Error ? error.message : 'UNKNOWN',
  );
  if (mode === 'provision') {
    for (const entry of [...created].reverse()) {
      try {
        await db.user.deleteMany({ where: { keycloakSubject: entry.id } });
      } catch {
        console.error('DB MANUAL CLEANUP REQUIRED FOR:', entry.username);
      }
      try {
        const removed = await admin('DELETE', '/users/' + entry.id);
        if (removed.status !== 204 && removed.status !== 404) {
          console.error('KEYCLOAK MANUAL CLEANUP REQUIRED FOR:', entry.username);
        }
      } catch {
        console.error('KEYCLOAK MANUAL CLEANUP REQUIRED FOR:', entry.username);
      }
    }
  }
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
JS
then
  echo "PHASE 19 ACCOUNT $mode: FAILED" >&2
  exit 1
fi

if [[ "$mode" == provision ]]; then
  python3 - "$output" <<'PY'
import json
import sys
from pathlib import Path

data = json.loads(Path(sys.argv[1]).read_text())
assert data["environment"] == "DEV"
assert data["purpose"] == "PHASE_19_ACCEPTANCE"
assert {a["role"] for a in data["accounts"]} == {"MODERATOR"}
assert all(a["password"] and a["id"] for a in data["accounts"])
PY
  target="$vault/phase19-dev-moderator-created.json"
  if [[ -e "$target" ]]; then
    echo "ERROR: Credentials destination already exists." >&2
    exit 1
  fi
  chmod 600 "$output"
  mv "$output" "$target"
  trap - EXIT
  echo "Keycloak users created: 1"
  echo "Application users with verified roles: 1"
  echo "Credentials stored locally: $target (mode 600)"
  echo "Passwords and tokens printed: NO"
  echo "PHASE 19 ACCOUNT PROVISION: PASS"
fi
