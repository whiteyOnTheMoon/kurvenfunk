import os,re,pathlib,subprocess,json
root=pathlib.Path('/workspace/kurvenfunk'); out=pathlib.Path(__file__).parent
keys=set()
for f in root.glob('compose*.yml'):keys.update(re.findall(r'\$\{([A-Z_][A-Z0-9_]*)',f.read_text()))
env={**os.environ,**{k:'synthetic-audit-placeholder' for k in keys}}
env.update(NODE_ENV='development',TZ='Europe/Vienna',PGTZ='Europe/Vienna',DATABASE_URL='postgresql://audit:audit@postgres:5432/audit',WEB_URL='http://web:3000',API_URL='http://api:3000',AUTH_URL='http://keycloak:8080',REDIS_PORT='6379',STORAGE_ENDPOINT='http://minio:9000')
r=[]
for suffix in ['dev','staging','prod']:
 p=subprocess.run(['docker','--host=unix:///var/run/docker.sock','compose','-f','compose.yml','-f',f'compose.{suffix}.yml','config','--quiet'],cwd=root,env=env,capture_output=True,text=True);r.append({'configuration':suffix,'exit':p.returncode,'stderr':p.stderr})
(out/'compose-checks.json').write_text(json.dumps(r,indent=2));print(r)
