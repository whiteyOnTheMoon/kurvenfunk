#!/usr/bin/env python3
"""Task 176: one-shot DEV-only E2E; no staging/prod operations.

Runs over existing GitHub Actions DEV SSH credentials, entirely on the DEV VPS.
All test identities are exact-match, pre-reserved .invalid accounts. No secrets
or tokens are printed or written to disk. Abort on any mismatch.
"""
import base64
import json
import os
import secrets
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('/home/ap/www/kurvenfunk')
EXPECTED_SHA = '3c6289cfca8fc8032980b1f94d63f3fd3900036b'
BASE = 'http://127.0.0.1:3102'
API = 'http://127.0.0.1:3101/api/v1'
CLIENT = 'kurvenfunk-task-176-e2e'
COMPOSE = ['docker', 'compose', '-p', 'kurvenfunk-dev', '--env-file', '.env.dev',
           '-f', 'compose.yml', '-f', 'compose.dev.yml']
ACCOUNTS = [
    ('target', 'e2e-176-target@dev.kurvenfunk.invalid', 'E2E 176 Target', 'kf176target'),
    ('moderator', 'e2e-176-moderator@dev.kurvenfunk.invalid', 'E2E 176 Moderator', 'kf176mod'),
]


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def command(args, input_text=None, timeout=45):
    result = subprocess.run(args, cwd=ROOT, input=input_text, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    require(result.returncode == 0, 'Command failed: ' + args[0] +
            ' (exit ' + str(result.returncode) + ')')
    return result.stdout.strip()


def env_setting(key):
    matches = []
    for line in (ROOT / '.env.dev').read_text().splitlines():
        if line.startswith(key + '='):
            value = line.split('=', 1)[1].strip()
            if len(value) >= 2 and value[0] in ('"', "'") and value[-1] == value[0]:
                value = value[1:-1]
            matches.append(value)
    require(len(matches) == 1 and bool(matches[0]), 'Missing or duplicated DEV setting ' + key)
    return matches[0]


def http(method, url, data=None, token=None, form=False):
    headers = {}
    if token:
        headers['authorization'] = 'Bearer ' + token
    if data is not None:
        headers['content-type'] = ('application/x-www-form-urlencoded' if form else 'application/json')
        if isinstance(data, dict):
            data = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, b''


def keycloak(method, path, token=None, data=None, form=False):
    return http(method, BASE + path, data, token, form)


def keycloak_json(method, path, token=None, data=None, form=False, expected=200):
    status, raw = keycloak(method, path, token, data, form)
    require(status == expected, 'Keycloak ' + method + ' HTTP=' + str(status) +
            ' (' + path.split('?')[0] + ')')
    if expected == 204 or not raw:
        return {}
    return json.loads(raw)


def decode_claims(token):
    segment = token.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(segment + '=' * (-len(segment) % 4)))


def query_client(admin_token):
    clients = keycloak_json('GET',
        '/admin/realms/kurvenfunk/clients?' + urllib.parse.urlencode({'clientId': CLIENT}),
        admin_token)
    return [x for x in clients if x.get('clientId') == CLIENT]


def api_node(source, subs):
    args = COMPOSE + ['exec', '-T',
        '-e', 'E2E_TARGET_SUB=' + subs['target'],
        '-e', 'E2E_MOD_SUB=' + subs['moderator'],
        'api', 'node', '--input-type=module', '-']
    out = command(args, input_text=source, timeout=50)
    matches = [x for x in out.splitlines() if x.startswith('RESULT_JSON:')]
    require(len(matches) == 1, 'Unexpected DEV Prisma response')
    return json.loads(matches[0].split(':', 1)[1])


CREATE_USERS = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const target=process.env.E2E_TARGET_SUB, mod=process.env.E2E_MOD_SUB;
  if (!target || !mod || target===mod) throw Error('Invalid test subjects');
  const url=new URL(process.env.DATABASE_URL);
  if (url.hostname!=='postgres' || url.pathname!=='/kurvenfunk')
    throw Error('Unexpected database host/name');
  const result=await db.$transaction(async tx=>{
    const existing=await tx.user.findMany({
      where:{OR:[
        {keycloakSubject:target},{keycloakSubject:mod},
        {nickname:{equals:'kf176target',mode:'insensitive'}},
        {nickname:{equals:'kf176mod',mode:'insensitive'}}
      ]}, select:{id:true}
    });
    if (existing.length) throw Error('Test subject or nickname already exists');
    const targetUser=await tx.user.create({
      data:{keycloakSubject:target,nickname:'kf176target',
        fanPreference:'NEUTRAL',onboardingCompleted:true},
      select:{id:true}
    });
    const moderatorUser=await tx.user.create({
      data:{keycloakSubject:mod,nickname:'kf176mod',
        fanPreference:'NEUTRAL',onboardingCompleted:true,
        roleAssignments:{create:{role:'MODERATOR'}}},
      select:{id:true}
    });
    return {targetId:targetUser.id,moderatorId:moderatorUser.id};
  });
  console.log('RESULT_JSON:'+JSON.stringify(result));
}finally{await db.$disconnect();}
"""

CHECK_STATE = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const target=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_TARGET_SUB},
    select:{id:true,status:true}
  });
  if(!target) throw Error('Missing target');
  const cards=await db.moderationCard.findMany({
    where:{userId:target.id},
    select:{type:true,escalationSource:true,reasonCode:true}
  });
  const audit=await db.auditLog.findMany({
    where:{targetUserId:target.id},
    select:{action:true,actorType:true,metadata:true}
  });
  const notices=await db.notification.findMany({
    where:{userId:target.id},
    select:{type:true,metadata:true}
  });
  const count=(items,fn)=>items.filter(fn).length;
  const red=notices.find(x=>x.type==='RED_CARD');
  const summary={
    status:target.status,
    yellowCards:count(cards,x=>x.type==='YELLOW'),
    redCards:count(cards,x=>x.type==='RED'),
    autoRedCards:count(cards,x=>x.type==='RED' && x.escalationSource==='THREE_YELLOW_CARDS'),
    yellowAudits:count(audit,x=>x.action==='MODERATION_CARD_CREATED' && x.actorType==='USER'),
    autoRedAudits:count(audit,x=>x.action==='MODERATION_CARD_CREATED' && x.actorType==='SECURITY_AUTOMATION'),
    statusAudits:count(audit,x=>x.action==='USER_STATUS_CHANGED' && x.actorType==='SECURITY_AUTOMATION'),
    yellowNotices:count(notices,x=>x.type==='YELLOW_CARD'),
    redNotices:count(notices,x=>x.type==='RED_CARD'),
    sessionRevocation:red?.metadata?.sessionRevocation??null
  };
  console.log('RESULT_JSON:'+JSON.stringify(summary));
}finally{await db.$disconnect();}
"""


def api_request(method, path, bearer, payload=None):
    return http(method, API + path, payload, bearer)


def keycloak_sessions(token, sub):
    value = keycloak_json('GET', '/admin/realms/kurvenfunk/users/' +
                          urllib.parse.quote(sub) + '/sessions', token)
    require(isinstance(value, list), 'Unexpected Keycloak sessions response')
    return len(value)


def prepare():
    require(os.geteuid() != 0 and os.environ.get('USER') == 'ap', 'Unexpected VPS user')
    require(command(['git', 'branch', '--show-current']) == 'develop', 'Wrong branch')
    require(command(['git', 'rev-parse', 'HEAD']) == EXPECTED_SHA, 'Wrong DEV commit')
    require(not command(['git', 'status', '--porcelain']), 'Dirty DEV worktree')
    require((ROOT / '.env.dev').is_file(), 'Missing .env.dev')
    for service in ('api', 'keycloak', 'postgres'):
        cid = command(COMPOSE + ['ps', '-q', service])
        require(bool(cid), 'Missing DEV ' + service)
        label = command(['docker', 'inspect', '--format',
                         '{{index .Config.Labels "com.docker.compose.project"}}', cid])
        require(label == 'kurvenfunk-dev', 'Unexpected Docker project')
    status, _ = http('GET', API + '/health')
    require(status == 200, 'DEV API unhealthy')
    print('E2E_DEV_ISOLATION: OK')


def main():
    prepare()
    adminuser = env_setting('KEYCLOAK_CONFIG_ADMIN_USERNAME')
    adminpass = env_setting('KEYCLOAK_CONFIG_ADMIN_PASSWORD')
    admin_result = keycloak_json('POST',
        '/realms/master/protocol/openid-connect/token',
        data={'grant_type': 'password', 'client_id': 'admin-cli',
              'username': adminuser, 'password': adminpass}, form=True)
    token = admin_result['access_token']
    print('E2E_PERSISTENT_ADMIN_AUTH: OK')
    subjects = {}
    for label, email, last, nickname in ACCOUNTS:
        lookup = keycloak_json('GET', '/admin/realms/kurvenfunk/users?' +
            urllib.parse.urlencode({'email': email, 'exact': 'true', 'max': '20'}), token)
        users = [u for u in lookup if u.get('email', '').lower() == email]
        require(len(users) == 1, 'Missing/duplicate DEV test email: ' + label)
        user = users[0]
        require(user.get('username', '').lower() == email and
                user.get('firstName') == 'Kurvenfunk' and
                user.get('lastName') == last and
                user.get('enabled') is True and user.get('emailVerified') is True,
                'Unexpected DEV test identity attributes: ' + label)
        subjects[label] = user['id']
    require(subjects['target'] != subjects['moderator'], 'Shared test subject')
    require(not query_client(token), 'Pre-existing E2E OAuth client; do not modify')
    print('E2E_DEDICATED_KEYCLOAK_IDENTITIES: OK')

    created_client_id = None
    try:
        # A disposable client avoids enabling password grants on the normal web client.
        status, _ = keycloak('POST', '/admin/realms/kurvenfunk/clients', token, {
            'clientId': CLIENT, 'name': 'Temporary Task 176 DEV E2E client',
            'protocol': 'openid-connect', 'enabled': True, 'publicClient': True,
            'serviceAccountsEnabled': False, 'standardFlowEnabled': False,
            'directAccessGrantsEnabled': True, 'fullScopeAllowed': False,
            'redirectUris': [], 'webOrigins': [],
        })
        require(status == 201, 'Cannot create disposable DEV OAuth client: HTTP=' + str(status))
        match = query_client(token)
        require(len(match) == 1, 'Disposable DEV client not uniquely found')
        created_client_id = match[0]['id']
        mapper = {
            'name': 'task-176-e2e-audience',
            'protocol': 'openid-connect',
            'protocolMapper': 'oidc-audience-mapper',
            'config': {
                'included.client.audience': 'kurvenfunk-api',
                'access.token.claim': 'true', 'id.token.claim': 'false',
            },
        }
        status, _ = keycloak('POST', '/admin/realms/kurvenfunk/clients/' +
                 created_client_id + '/protocol-mappers/models', token, mapper)
        require(status == 201, 'Could not attach API audience to DEV test client')
        print('E2E_DISPOSABLE_OAUTH_CLIENT: READY')

        # Create a true online Keycloak user session before the ban.
        user_tokens = {}
        for label, email, _, _ in ACCOUNTS:
            password = secrets.token_urlsafe(40)
            status, _ = keycloak('PUT', '/admin/realms/kurvenfunk/users/' +
                subjects[label] + '/reset-password', token,
                {'type': 'password', 'value': password, 'temporary': False})
            require(status == 204, 'Could not set dedicated test password for ' + label)
            credentials = keycloak_json('POST',
                '/realms/kurvenfunk/protocol/openid-connect/token',
                data={'grant_type': 'password', 'client_id': CLIENT,
                      'scope': 'openid email profile',
                      'username': email, 'password': password}, form=True)
            bearer = credentials['access_token']
            claims = decode_claims(bearer)
            aud = claims.get('aud', [])
            if isinstance(aud, str):
                aud = [aud]
            require('kurvenfunk-api' in aud and claims.get('sub') == subjects[label] and
                    claims.get('email_verified') is True,
                    'E2E OIDC token missing required claims for ' + label)
            user_tokens[label] = bearer
        before = keycloak_sessions(token, subjects['target'])
        require(before >= 1, 'No active Keycloak session before the ban')
        print('E2E_TARGET_SESSION_BEFORE: ACTIVE')

        created = api_node(CREATE_USERS, subjects)
        require(bool(created.get('targetId') and created.get('moderatorId')) and
                created['targetId'] != created['moderatorId'],
                'Could not create isolated Kurvenfunk DEV accounts')
        print('E2E_KURVENFUNK_TEST_USERS: CREATED')
        initial = api_node(CHECK_STATE, subjects)
        require(initial['status'] == 'ACTIVE' and initial['yellowCards'] == 0 and
                initial['redCards'] == 0 and initial['yellowNotices'] == 0,
                'Unexpected moderation state before test')

        code, _ = api_request('GET', '/auth/me', user_tokens['target'])
        require(code == 200, 'Authenticated target not ACTIVE before test')
        print('E2E_TARGET_AUTH_BEFORE: HTTP_200')

        for number, expected_stage in [(1, 'YELLOW'), (2, 'SECOND_YELLOW'),
                                       (3, 'RED_CARD_REQUIRED')]:
            payload = {
                'userId': created['targetId'], 'reasonCode': 'E2E_TASK_176',
                'moderatorNote': 'Dedicated Task 176 automated DEV E2E only',
                'userMessage': 'Automatischer Test von Task 176.',
                'sourceType': 'NONE',
            }
            code, data = api_request('POST', '/moderation/yellow-cards',
                                     user_tokens['moderator'], payload)
            require(code == 201, 'Yellow card ' + str(number) + ' HTTP=' + str(code))
            response = json.loads(data)
            require(response.get('yellowCardCount') == number and
                    response.get('counterStage') == expected_stage,
                    'Unexpected escalation on yellow card ' + str(number))
            if number < 3:
                require(response.get('redCardId') is None and
                        response.get('accountStatus') == 'ACTIVE',
                        'Premature red card or ban')
            else:
                require(bool(response.get('redCardId')) and
                        response.get('accountStatus') == 'BANNED',
                        'Missing automatic red card or ban')
                require(response.get('sessionRevocation') in ('REVOKED', 'PENDING'),
                        'Unexpected Keycloak revocation state')
            print('E2E_YELLOW_' + str(number) + ': OK')

        summary = None
        for attempt in range(12):
            summary = api_node(CHECK_STATE, subjects)
            if summary['sessionRevocation'] == 'REVOKED':
                break
            if attempt < 11:
                time.sleep(10)
        require(summary is not None and summary['sessionRevocation'] == 'REVOKED',
                'Keycloak session revocation never reached REVOKED')
        for key, expected in [
            ('status', 'BANNED'), ('yellowCards', 3), ('redCards', 1),
            ('autoRedCards', 1), ('yellowAudits', 3),
            ('autoRedAudits', 1), ('statusAudits', 1),
            ('yellowNotices', 3), ('redNotices', 1),
        ]:
            require(summary[key] == expected, 'Unexpected database invariant: ' + key)
        print('E2E_DB_CARDS_AUDIT_NOTIFICATIONS: OK')
        print('E2E_SESSION_METADATA: REVOKED')

        after = keycloak_sessions(token, subjects['target'])
        require(after == 0, 'Keycloak still has active sessions for banned E2E target')
        print('E2E_TARGET_SESSION_AFTER: ZERO')

        # A previously issued JWT must be rejected by the central AccountStatusGuard.
        code, _ = api_request('GET', '/auth/me', user_tokens['target'])
        require(code == 403, 'BANNED user can still access authenticated API')
        print('E2E_BANNED_API_GUARD: HTTP_403')

        payload = {
            'userId': created['targetId'], 'reasonCode': 'E2E_TASK_176',
            'moderatorNote': 'Verify duplicate automatic red prevention',
            'sourceType': 'NONE',
        }
        code, _ = api_request('POST', '/moderation/yellow-cards',
                              user_tokens['moderator'], payload)
        require(code == 409, 'Additional warning not rejected for BANNED target')
        unchanged = api_node(CHECK_STATE, subjects)
        require(unchanged == summary, 'BANNED duplicate attempt changed moderation state')
        print('E2E_NO_DUPLICATE_RED_CARD: OK')
        print('TASK_176_FULL_DEV_E2E: PASS')
    finally:
        # Delete only the disposable client that THIS run created.
        if created_client_id:
            status, _ = keycloak('DELETE',
                '/admin/realms/kurvenfunk/clients/' + created_client_id, token)
            print('E2E_DISPOSABLE_CLIENT_DELETE_HTTP:', status)
            require(status == 204, 'Could not remove temporary E2E OAuth client')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never emit auth response bodies, environment values, tokens or passwords.
        print('TASK_176_FULL_DEV_E2E: FAIL - ' + str(error))
        raise SystemExit(1)
