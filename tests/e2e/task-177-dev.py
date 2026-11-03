#!/usr/bin/env python3
"""One-shot Task 177 DEV E2E. Uses only reserved .invalid test identities.

The script is executed over the existing DEV-only GitHub Actions SSH connection.
It never prints passwords, tokens, private notes, Keycloak user IDs, or DB IDs.
No staging/production hosts, projects, databases or user accounts are touched.
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
EXPECTED_SHA = '0af6cf23622bde5755b6a784a7e406013ce63cdb'
BASE = 'http://127.0.0.1:3102'
API = 'http://127.0.0.1:3101/api/v1'
CLIENT = 'kurvenfunk-task-177-e2e'
TARGET_EMAIL = 'e2e-177-target@dev.kurvenfunk.invalid'
ACTOR_EMAIL = 'e2e-176-moderator@dev.kurvenfunk.invalid'
TARGET_NICK = 'kf177target'
ACTOR_NICK = 'kf176mod'
REASON = 'E2E_DIRECT_177'
COMPOSE = ['docker', 'compose', '-p', 'kurvenfunk-dev', '--env-file', '.env.dev',
           '-f', 'compose.yml', '-f', 'compose.dev.yml']


def require(value, message):
    if not value:
        raise RuntimeError(message)


def cmd(args, input_text=None, timeout=45):
    result = subprocess.run(args, cwd=ROOT, input=input_text, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    require(result.returncode == 0, 'DEV command failed: ' + args[0])
    return result.stdout.strip()


def env(key):
    matches = []
    for line in (ROOT / '.env.dev').read_text().splitlines():
        if line.startswith(key + '='):
            value = line.split('=', 1)[1].strip()
            if len(value) >= 2 and value[0] in ("'", '"') and value[-1] == value[0]:
                value = value[1:-1]
            matches.append(value)
    require(len(matches) == 1 and bool(matches[0]), 'Missing or ambiguous DEV setting: ' + key)
    return matches[0]


def http(method, url, data=None, token=None, form=False):
    headers = {}
    if token is not None:
        headers['authorization'] = 'Bearer ' + token
    if data is not None:
        headers['content-type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
        if isinstance(data, dict):
            data = (urllib.parse.urlencode(data) if form else json.dumps(data)).encode()
    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as e:
        return e.code, b''


def kc(method, path, token=None, data=None, form=False):
    return http(method, BASE + path, data=data, token=token, form=form)


def kc_json(method, path, token=None, data=None, form=False, status=200):
    actual, body = kc(method, path, token=token, data=data, form=form)
    require(actual == status, 'DEV Keycloak ' + method + ' HTTP=' + str(actual) +
            ' (' + path.split('?')[0] + ')')
    return json.loads(body) if body else {}


def claims(bearer):
    segment = bearer.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(segment + '=' * (-len(segment) % 4)))


def find_email(admin, email):
    path = '/admin/realms/kurvenfunk/users?' + urllib.parse.urlencode(
        {'email': email, 'exact': 'true', 'max': '50'})
    return [u for u in kc_json('GET', path, admin) if u.get('email', '').lower() == email]


def find_client(admin):
    path = '/admin/realms/kurvenfunk/clients?' + urllib.parse.urlencode({'clientId': CLIENT})
    return [c for c in kc_json('GET', path, admin) if c.get('clientId') == CLIENT]


def sessions(admin, subject):
    result = kc_json('GET', '/admin/realms/kurvenfunk/users/' +
                     urllib.parse.quote(subject) + '/sessions', admin)
    require(isinstance(result, list), 'Unexpected session response')
    return len(result)


def prisma(js, subjects, extra_env=None):
    args = COMPOSE + [
        'exec', '-T',
        '-e', 'E2E_TARGET_SUB=' + subjects['target'],
        '-e', 'E2E_MOD_SUB=' + subjects['moderator'],
    ]
    for name, value in (extra_env or {}).items():
        require(name in ('E2E_TEST_ROLE_ID',), 'Unexpected environment parameter')
        args += ['-e', name + '=' + value]
    args += ['api', 'node', '--input-type=module', '-']
    output = cmd(args, js, timeout=60)
    matches = [line.split(':', 1)[1] for line in output.splitlines()
               if line.startswith('RESULT_JSON:')]
    require(len(matches) == 1, 'Unexpected DEV database response')
    return json.loads(matches[0])


CHECK_MODERATOR = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const url=new URL(process.env.DATABASE_URL);
  if(url.hostname!=='postgres'||url.pathname!=='/kurvenfunk') throw Error('Wrong DB');
  const mod=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_MOD_SUB},
    select:{id:true,nickname:true,status:true,onboardingCompleted:true,
      roleAssignments:{select:{role:true,expiresAt:true}}}
  });
  if(!mod||mod.nickname!=='kf176mod'||mod.status!=='ACTIVE'||
     !mod.onboardingCompleted)throw Error('Unexpected moderator identity');
  const active=mod.roleAssignments.filter(x=>!x.expiresAt||x.expiresAt>new Date());
  if(active.length!==1||active[0].role!=='MODERATOR')
    throw Error('Test moderator has unexpected active permissions');
  const duplicate=await db.user.findFirst({
    where:{nickname:{equals:'kf177target',mode:'insensitive'}},select:{id:true}
  });
  if(duplicate)throw Error('Target test nickname already exists');
  console.log('RESULT_JSON:'+JSON.stringify({moderatorVerified:true}));
}finally{await db.$disconnect();}
"""

CREATE_TARGET = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const url=new URL(process.env.DATABASE_URL);
  if(url.hostname!=='postgres'||url.pathname!=='/kurvenfunk')throw Error('Wrong DB');
  const target=process.env.E2E_TARGET_SUB;
  const existing=await db.user.findFirst({
    where:{OR:[{keycloakSubject:target},
      {nickname:{equals:'kf177target',mode:'insensitive'}}]},
    select:{id:true}
  });
  if(existing)throw Error('Target test account already exists in Kurvenfunk');
  const result=await db.user.create({
    data:{keycloakSubject:target,nickname:'kf177target',status:'ACTIVE',
      fanPreference:'NEUTRAL',onboardingCompleted:true},
    select:{id:true}
  });
  console.log('RESULT_JSON:'+JSON.stringify({id:result.id}));
}finally{await db.$disconnect();}
"""

GRANT_ADMIN = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const u=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_MOD_SUB},
    select:{id:true,nickname:true,status:true,
      roleAssignments:{select:{role:true,expiresAt:true}}}
  });
  if(!u||u.nickname!=='kf176mod'||u.status!=='ACTIVE')throw Error('Wrong actor');
  const active=u.roleAssignments.filter(x=>!x.expiresAt||x.expiresAt>new Date());
  if(active.length!==1||active[0].role!=='MODERATOR')
    throw Error('Actor permissions changed; refusing escalation');
  const role=await db.userRoleAssignment.create({
    data:{userId:u.id,role:'ADMIN'},select:{id:true}
  });
  console.log('RESULT_JSON:'+JSON.stringify({roleId:role.id}));
}finally{await db.$disconnect();}
"""

REMOVE_ADMIN = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const mod=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_MOD_SUB},
    select:{id:true,nickname:true}
  });
  if(!mod||mod.nickname!=='kf176mod')throw Error('Unexpected E2E actor');
  const id=process.env.E2E_TEST_ROLE_ID;
  const role=await db.userRoleAssignment.findUnique({
    where:{id},select:{id:true,userId:true,role:true}
  });
  if(!role||role.userId!==mod.id||role.role!=='ADMIN')
    throw Error('Unexpected E2E temporary role');
  await db.userRoleAssignment.delete({where:{id}});
  const remaining=await db.userRoleAssignment.findMany({
    where:{userId:mod.id},select:{role:true,expiresAt:true}
  });
  const active=remaining.filter(x=>!x.expiresAt||x.expiresAt>new Date());
  if(active.length!==1||active[0].role!=='MODERATOR')
    throw Error('Actor permissions not restored');
  console.log('RESULT_JSON:'+JSON.stringify({restored:true}));
}finally{await db.$disconnect();}
"""

CHECK_STATE = r"""
import { createPrismaClient } from '@kurvenfunk/database';
const db=createPrismaClient();
try {
  const u=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_TARGET_SUB},
    select:{id:true,status:true}
  });
  if(!u)throw Error('Missing test target');
  const cards=await db.moderationCard.findMany({
    where:{userId:u.id},
    select:{type:true,status:true,escalationSource:true,reasonCode:true,
      sourceType:true,moderatorId:true,moderatorNote:true}
  });
  const logs=await db.auditLog.findMany({
    where:{targetUserId:u.id},
    select:{action:true,actorType:true,actorUserId:true,metadata:true}
  });
  const notices=await db.notification.findMany({
    where:{userId:u.id},
    select:{type:true,body:true,metadata:true}
  });
  const actor=await db.user.findUnique({
    where:{keycloakSubject:process.env.E2E_MOD_SUB},select:{id:true}
  });
  if(!actor)throw Error('Missing E2E actor');
  const filter=(list,test)=>list.filter(test).length;
  const red=cards.find(x=>x.type==='RED');
  const notice=notices.find(x=>x.type==='RED_CARD');
  console.log('RESULT_JSON:'+JSON.stringify({
    status:u.status,
    cards:cards.length,
    yellow:filter(cards,x=>x.type==='YELLOW'),
    red:filter(cards,x=>x.type==='RED'),
    directRed:filter(cards,x=>x.type==='RED'&&x.status==='ACTIVE'&&
      x.escalationSource==='MANUAL'&&x.reasonCode==='E2E_DIRECT_177'&&
      x.sourceType==='NONE'&&x.moderatorId===actor.id),
    createdLogs:filter(logs,x=>x.action==='MODERATION_CARD_CREATED'&&
      x.actorType==='USER'&&x.actorUserId===actor.id),
    statusLogs:filter(logs,x=>x.action==='USER_STATUS_CHANGED'&&
      x.actorType==='USER'&&x.actorUserId===actor.id&&
      x.metadata?.newStatus==='BANNED'),
    noticeCount:filter(notices,x=>x.type==='RED_CARD'),
    noticeReason:notice?.metadata?.reasonCode??null,
    revocation:notice?.metadata?.sessionRevocation??null,
    privateNoteLeaked:notice?.body?.includes('Internal E2E note')??false,
  }));
}finally{await db.$disconnect();}
"""


def prepare():
    require(os.geteuid() != 0 and os.environ.get('USER') == 'ap', 'Wrong VPS user')
    require(cmd(['git', 'branch', '--show-current']) == 'develop', 'Wrong git branch')
    require(cmd(['git', 'rev-parse', 'HEAD']) == EXPECTED_SHA,
            'DEV commit does not match verified Task 177 merge')
    require(not cmd(['git', 'status', '--porcelain']), 'Dirty DEV working tree')
    require((ROOT / '.env.dev').is_file(), 'Missing DEV configuration')
    for service in ('api', 'postgres', 'keycloak'):
        cid = cmd(COMPOSE + ['ps', '-q', service])
        require(cid, 'Missing DEV container: ' + service)
        label = cmd(['docker', 'inspect', '--format',
                     '{{index .Config.Labels "com.docker.compose.project"}}', cid])
        require(label == 'kurvenfunk-dev', 'Unexpected Docker project')
    for name, url in [('API', API + '/health'),
                      ('WEB', 'http://127.0.0.1:3100/health')]:
        status, _ = http('GET', url)
        require(status == 200, 'DEV ' + name + ' unhealthy')
    print('TASK_177_DEV_ISOLATION: OK')


def main():
    prepare()
    require(env('KEYCLOAK_CONFIG_ADMIN_USERNAME').lower() == 'whiteyonthemoon',
            'Persistent DEV admin mismatch')
    admin = kc_json('POST', '/realms/master/protocol/openid-connect/token',
        data={'grant_type': 'password', 'client_id': 'admin-cli',
              'username': env('KEYCLOAK_CONFIG_ADMIN_USERNAME'),
              'password': env('KEYCLOAK_CONFIG_ADMIN_PASSWORD')}, form=True)['access_token']
    print('TASK_177_PERSISTENT_ADMIN: AUTHENTICATED')

    actor_matches = find_email(admin, ACTOR_EMAIL)
    require(len(actor_matches) == 1, '176 test moderator missing/ambiguous in Keycloak')
    actor = actor_matches[0]
    require(actor.get('username', '').lower() == ACTOR_EMAIL and
            actor.get('firstName') == 'Kurvenfunk' and
            actor.get('lastName') == 'E2E 176 Moderator' and
            actor.get('enabled') is True and actor.get('emailVerified') is True,
            'Test moderator attributes do not match reserved identity')
    subjects = {'moderator': actor['id']}
    require(prisma(CHECK_MODERATOR, subjects | {'target': actor['id']})['moderatorVerified'],
            'Dedicated test moderator precondition failed')

    require(len(find_email(admin, TARGET_EMAIL)) == 0,
            'Task 177 target email already exists')
    require(len(find_client(admin)) == 0, 'Temporary OAuth client already exists')
    print('TASK_177_ACCOUNT_COLLISIONS: NONE')

    # Create only the explicitly reserved Task 177 DEV target identity.
    created_target = False
    client_id = None
    test_admin_role = None
    try:
        status, _ = kc('POST', '/admin/realms/kurvenfunk/users', admin, {
            'username': TARGET_EMAIL,
            'email': TARGET_EMAIL,
            'firstName': 'Kurvenfunk',
            'lastName': 'E2E 177 Target',
            'enabled': True, 'emailVerified': True,
            'requiredActions': [],
        })
        require(status == 201, 'Cannot create reserved DEV target: HTTP=' + str(status))
        matches = find_email(admin, TARGET_EMAIL)
        require(len(matches) == 1 and matches[0].get('username', '').lower() == TARGET_EMAIL,
                'New DEV target identity not uniquely visible')
        subjects['target'] = matches[0]['id']
        require(subjects['target'] != subjects['moderator'], 'Shared Keycloak subject')
        created_target = True
        print('TASK_177_DEDICATED_TARGET: VERIFIED')

        status, _ = kc('POST', '/admin/realms/kurvenfunk/clients', admin, {
            'clientId': CLIENT, 'name': 'Temporary Task 177 DEV E2E client',
            'protocol': 'openid-connect', 'enabled': True, 'publicClient': True,
            'serviceAccountsEnabled': False, 'standardFlowEnabled': False,
            'directAccessGrantsEnabled': True, 'fullScopeAllowed': False,
            'redirectUris': [], 'webOrigins': [],
        })
        require(status == 201, 'Cannot create disposable DEV OAuth client')
        clients = find_client(admin)
        require(len(clients) == 1, 'Disposable OAuth client not uniquely found')
        client_id = clients[0]['id']
        status, _ = kc('POST', '/admin/realms/kurvenfunk/clients/' +
                       client_id + '/protocol-mappers/models', admin, {
            'name': 'task-177-e2e-audience',
            'protocol': 'openid-connect',
            'protocolMapper': 'oidc-audience-mapper',
            'config': {
                'included.client.audience': 'kurvenfunk-api',
                'access.token.claim': 'true',
                'id.token.claim': 'false',
            },
        })
        require(status == 201, 'Cannot add API audience to temporary OAuth client')
        print('TASK_177_DISPOSABLE_OAUTH_CLIENT: READY')

        user_tokens = {}
        for label, email in [('target', TARGET_EMAIL), ('moderator', ACTOR_EMAIL)]:
            password = secrets.token_urlsafe(40)
            status, _ = kc('PUT', '/admin/realms/kurvenfunk/users/' +
                           urllib.parse.quote(subjects[label]) + '/reset-password', admin, {
                'type': 'password', 'value': password, 'temporary': False,
            })
            require(status == 204, 'Could not configure test-only credentials for ' + label)
            result = kc_json('POST', '/realms/kurvenfunk/protocol/openid-connect/token',
                data={'grant_type': 'password', 'client_id': CLIENT,
                      'scope': 'openid email profile', 'username': email,
                      'password': password}, form=True)
            bearer = result.get('access_token')
            require(isinstance(bearer, str) and bearer, 'Missing test access token')
            p = claims(bearer)
            aud = p.get('aud', [])
            if isinstance(aud, str):
                aud = [aud]
            require(p.get('sub') == subjects[label] and 'kurvenfunk-api' in aud and
                    p.get('email_verified') is True, 'Test token invalid for ' + label)
            user_tokens[label] = bearer
        require(sessions(admin, subjects['target']) >= 1, 'Target lacked active session')
        print('TASK_177_SESSION_BEFORE: ACTIVE')

        created = prisma(CREATE_TARGET, subjects)
        require(created.get('id'), 'Could not create reserved Kurvenfunk test user')
        initial = prisma(CHECK_STATE, subjects)
        require(initial['status'] == 'ACTIVE' and initial['cards'] == 0,
                'Unexpected target state before direct red-card test')
        status, _ = http('GET', API + '/auth/me', token=user_tokens['target'])
        require(status == 200, 'DEV target authentication failed before ban')
        print('TASK_177_TARGET_AUTH_BEFORE: HTTP_200')

        payload = {
            'userId': created['id'],
            'reasonCode': REASON,
            'moderatorNote': 'Internal E2E note - never user visible',
            'userMessage': 'Automatisierter Test der direkten roten Karte.',
            'sourceType': 'NONE',
        }
        # The existing test MODERATOR must not have user.ban.
        status, _ = http('POST', API + '/moderation/red-cards',
                         data=payload, token=user_tokens['moderator'])
        require(status == 403, 'MODERATOR improperly granted user.ban')
        denied = prisma(CHECK_STATE, subjects)
        require(denied == initial, 'Forbidden direct ban changed user data')
        print('TASK_177_PERMISSION_DENIAL: HTTP_403')

        # Temporarily grant ADMIN ONLY to the reserved E2E moderator account.
        grant = prisma(GRANT_ADMIN, subjects)
        require(grant.get('roleId'), 'Temporary ADMIN role grant failed')
        test_admin_role = grant['roleId']

        status, body = http('POST', API + '/moderation/red-cards',
                            data=payload, token=user_tokens['moderator'])
        require(status == 201, 'Direct red card API rejected authorized request (HTTP=' +
                str(status) + ')')
        response = json.loads(body).get('data', {})
        require(response.get('id') and
                response.get('accountStatus') == 'BANNED' and
                response.get('type') == 'RED' and
                response.get('escalationSource') == 'MANUAL' and
                response.get('sessionRevocation') in ('PENDING', 'REVOKED'),
                'Direct red response missing required fields')
        require(not any(k in response for k in
                    ('moderatorNote', 'userMessage', 'keycloakSubject', 'notificationId')),
                'Direct red response exposed internal fields')
        print('TASK_177_DIRECT_RED_API: HTTP_201')

        summary = None
        for attempt in range(12):
            summary = prisma(CHECK_STATE, subjects)
            if summary['revocation'] == 'REVOKED':
                break
            if attempt < 11:
                time.sleep(10)
        require(summary is not None and summary['revocation'] == 'REVOKED',
                'Session revocation did not reach REVOKED')
        for key, expected in [
            ('status', 'BANNED'), ('cards', 1), ('yellow', 0),
            ('red', 1), ('directRed', 1), ('createdLogs', 1),
            ('statusLogs', 1), ('noticeCount', 1), ('noticeReason', REASON),
            ('privateNoteLeaked', False),
        ]:
            require(summary[key] == expected, 'Unexpected persisted invariant: ' + key)
        print('TASK_177_DB_AUDIT_NOTIFICATIONS: VERIFIED')
        print('TASK_177_SESSION_METADATA: REVOKED')
        require(sessions(admin, subjects['target']) == 0,
                'Keycloak sessions remain after direct ban')
        print('TASK_177_SESSION_AFTER: ZERO')

        status, _ = http('GET', API + '/auth/me', token=user_tokens['target'])
        require(status == 403, 'BANNED user still accesses API')
        print('TASK_177_ACCOUNT_STATUS_GUARD: HTTP_403')

        status, _ = http('POST', API + '/moderation/red-cards',
                         data=payload, token=user_tokens['moderator'])
        require(status == 409, 'Duplicate direct red not refused')
        require(prisma(CHECK_STATE, subjects) == summary,
                'Duplicate attempt changed card/audit/notification state')
        print('TASK_177_DUPLICATE_PROTECTION: VERIFIED')
        print('TASK_177_DEV_E2E: PASS')

    finally:
        if test_admin_role is not None:
            require(prisma(REMOVE_ADMIN, subjects,
                           extra_env={'E2E_TEST_ROLE_ID': test_admin_role})['restored'],
                    'Test actor ADMIN role removal failed')
            print('TASK_177_TEMPORARY_ADMIN_ROLE: REMOVED')
        if client_id is not None:
            status, _ = kc('DELETE', '/admin/realms/kurvenfunk/clients/' +
                           client_id, admin)
            require(status == 204, 'Temporary OAuth client cleanup failed')
            print('TASK_177_TEMPORARY_OAUTH_CLIENT: REMOVED')
        if created_target:
            print('TASK_177_TEST_TARGET: RETAINED_FOR_AUDIT')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('TASK_177_DEV_E2E: FAIL - ' + str(error))
        raise SystemExit(1)
