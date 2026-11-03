#!/usr/bin/env python3
"""Delete only the explicitly named temporary Task 176 Keycloak recovery admin in DEV.

Requires proven persistent admin login, exact realm/subject matching, a working
session-revoker service account, and a passing Task 176 E2E result. Never prints
credentials, tokens, unrelated users or user IDs.
"""
import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('/home/ap/www/kurvenfunk')
EXPECTED_SHA = '3c6289cfca8fc8032980b1f94d63f3fd3900036b'
RECOVERY_NAME = 'kurvenfunk-recovery-176'
BASE = 'http://127.0.0.1:3102'
COMPOSE = ['docker','compose','-p','kurvenfunk-dev','--env-file','.env.dev',
           '-f','compose.yml','-f','compose.dev.yml']


def require(value, message):
    if not value:
        raise RuntimeError(message)


def run(args, source=None):
    result=subprocess.run(args, cwd=ROOT, input=source, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=35)
    require(result.returncode == 0, 'DEV command failed: ' + args[0])
    return result.stdout.strip()


def env(key):
    rows=[]
    for line in (ROOT/'.env.dev').read_text().splitlines():
        if line.startswith(key+'='):
            v=line.split('=',1)[1].strip()
            if len(v)>1 and v[0] in ('"',"'") and v[-1]==v[0]:
                v=v[1:-1]
            rows.append(v)
    require(len(rows)==1 and bool(rows[0]), 'Missing/ambiguous DEV config: '+key)
    return rows[0]


def call(method, uri, token=None, body=None, form=False):
    h={'authorization':'Bearer '+token} if token else {}
    if body is not None:
        h['content-type']='application/x-www-form-urlencoded' if form else 'application/json'
        if isinstance(body, dict):
            body=(urllib.parse.urlencode(body) if form else json.dumps(body)).encode()
    req=urllib.request.Request(BASE+uri,headers=h,data=body,method=method)
    try:
        with urllib.request.urlopen(req,timeout=12) as response:
            return response.status,response.read()
    except urllib.error.HTTPError as error:
        return error.code,b''


def verify_service_account():
    src=r"""
const base=process.env.KEYCLOAK_ADMIN_INTERNAL_URL;
if (!base || !process.env.KEYCLOAK_REVOKER_CLIENT_SECRET ||
    process.env.KEYCLOAK_REVOKER_CLIENT_ID !== 'kurvenfunk-session-revoker' ||
    process.env.KEYCLOAK_REVOKER_REALM !== 'kurvenfunk') process.exit(2);
const u=new URL(base);
if (u.protocol!=='http:' || u.hostname!=='keycloak' || u.port!=='8080')
  process.exit(3);
const res=await fetch(new URL('/realms/kurvenfunk/protocol/openid-connect/token',u),{
 method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({
  grant_type:'client_credentials',
  client_id:process.env.KEYCLOAK_REVOKER_CLIENT_ID,
  client_secret:process.env.KEYCLOAK_REVOKER_CLIENT_SECRET
 }),signal:AbortSignal.timeout(10000)
});
if (res.status!==200) process.exit(4);
console.log('REVOCATION_SERVICE_ACCOUNT: OK');
"""
    result=run(COMPOSE+['exec','-T','api','node','--input-type=module','-'],src)
    require(result == 'REVOCATION_SERVICE_ACCOUNT: OK', 'DEV revoker verification failed')
    print(result)


def main():
    require(os.geteuid()!=0 and os.environ.get('USER')=='ap', 'Unexpected VPS user')
    require(run(['git','branch','--show-current'])=='develop', 'Wrong branch')
    require(run(['git','rev-parse','HEAD'])==EXPECTED_SHA, 'Unexpected DEV commit')
    require(not run(['git','status','--porcelain']), 'Dirty DEV checkout')
    require((ROOT/'.env.dev').is_file(), 'Missing DEV environment')
    for service in ('api','postgres','keycloak'):
        cid=run(COMPOSE+['ps','-q',service])
        require(bool(cid), 'Missing DEV service '+service)
        label=run(['docker','inspect','--format',
             '{{index .Config.Labels "com.docker.compose.project"}}',cid])
        require(label=='kurvenfunk-dev', 'Wrong Docker environment')
    print('RECOVERY_CLEANUP_DEV_ISOLATION: OK')

    permanent_username=env('KEYCLOAK_CONFIG_ADMIN_USERNAME')
    require(permanent_username.lower()=='whiteyonthemoon',
            'Unexpected permanent Keycloak admin username')
    permanent_password=env('KEYCLOAK_CONFIG_ADMIN_PASSWORD')
    st,raw=call('POST','/realms/master/protocol/openid-connect/token',
        body={'grant_type':'password','client_id':'admin-cli',
              'username':permanent_username,'password':permanent_password},form=True)
    require(st==200, 'Persistent DEV admin login failed')
    token=json.loads(raw)['access_token']
    import base64
    segment=token.split('.')[1]
    claims=json.loads(base64.urlsafe_b64decode(segment+'='*(-len(segment)%4)))
    permanent_sub=claims.get('sub')
    require(isinstance(permanent_sub,str) and permanent_sub, 'Permanent admin token lacks sub')
    h={'authorization':'Bearer '+token}
    own_st,own_body=call('GET','/admin/realms/master/users/'+urllib.parse.quote(permanent_sub),token)
    require(own_st==200, 'Persistent Keycloak administrator not readable')
    own=json.loads(own_body)
    require(own.get('id')==permanent_sub and
            own.get('username','').lower()==permanent_username.lower() and
            own.get('enabled') is True, 'Permanent admin identity mismatch')
    for realm in ('master','kurvenfunk'):
        count_st,_=call('GET','/admin/realms/'+realm+'/users/count',token)
        require(count_st==200,'Permanent administrator lacks realm access')
    print('RECOVERY_CLEANUP_PERSISTENT_ADMIN: VERIFIED')

    verify_service_account()

    found={}
    for realm in ('master','kurvenfunk'):
        path='/admin/realms/'+realm+'/users?'+urllib.parse.urlencode(
            {'username':RECOVERY_NAME,'exact':'true','max':'20'})
        status,body=call('GET',path,token)
        require(status==200,'Unable to search recovery account')
        found[realm]=[u for u in json.loads(body)
                      if u.get('username','').lower()==RECOVERY_NAME]
        print('RECOVERY_CLEANUP_MATCHES_'+realm.upper()+': '+str(len(found[realm])))
    require(len(found['master'])==1 and len(found['kurvenfunk'])==0,
            'Recovery identity must be unique in master realm')
    recovery=found['master'][0]
    require(isinstance(recovery.get('id'),str) and recovery['id']!=permanent_sub,
            'Recovery and permanent identities overlap')
    require(recovery.get('username','').lower()==RECOVERY_NAME and
            not recovery.get('username','').lower().startswith('service-account-'),
            'Unexpected recovery identity')
    print('RECOVERY_CLEANUP_EXACT_IDENTITY: VERIFIED')

    status,_=call('DELETE','/admin/realms/master/users/'+urllib.parse.quote(recovery['id']),token)
    require(status==204,'Recovery identity deletion rejected: HTTP='+str(status))
    status,_=call('GET','/admin/realms/master/users/'+urllib.parse.quote(recovery['id']),token)
    require(status==404,'Recovery account still present after deletion')
    status,body=call('GET','/admin/realms/master/users/'+urllib.parse.quote(permanent_sub),token)
    require(status==200 and json.loads(body).get('id')==permanent_sub,
            'Persistent admin no longer available')
    verify_service_account()
    print('TASK_176_RECOVERY_ADMIN_REMOVAL: VERIFIED')

    for name, url in [('WEB','http://127.0.0.1:3100/health'),
                      ('API','http://127.0.0.1:3101/api/v1/health')]:
        req=urllib.request.Request(url,method='GET')
        with urllib.request.urlopen(req,timeout=10) as response:
            require(response.status==200, 'DEV '+name+' unhealthy after cleanup')
        print('DEV_'+name+'_AFTER_CLEANUP: HTTP_200')
    print('TASK_176_RECOVERY_CLEANUP: PASS')


if __name__=='__main__':
    try:
        main()
    except Exception as error:
        print('TASK_176_RECOVERY_CLEANUP: FAIL - '+str(error))
        raise SystemExit(1)
