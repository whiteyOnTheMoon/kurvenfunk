import subprocess,os,secrets,time,json
from pathlib import Path
out=Path(__file__).parent
D=['docker','--host=unix:///var/run/docker.sock']
names=['kf-verification-pg','kf-verification-redis']
def run(a,**kw):return subprocess.run(a,check=True,**kw)
pw=secrets.token_hex(24); rp=secrets.token_hex(24)
try:
 run(D+['run','-d','--name',names[0],'-e','POSTGRES_USER=audit','-e','POSTGRES_DB=audit','-e','POSTGRES_PASSWORD='+pw,'-p','127.0.0.1::5432','postgres:17-alpine'],stdout=subprocess.DEVNULL)
 run(D+['run','-d','--name',names[1],'-p','127.0.0.1::6379','redis:7.4-alpine','redis-server','--requirepass',rp],stdout=subprocess.DEVNULL)
 def port(name,p):return subprocess.check_output(D+['port',name,p],text=True).strip().split(':')[-1]
 env=os.environ.copy();env.update(DATABASE_URL=f'postgresql://audit:{pw}@127.0.0.1:{port(names[0],"5432")}/audit',REDIS_HOST='127.0.0.1',REDIS_PORT=port(names[1],'6379'),REDIS_PASSWORD=rp,NODE_ENV='development',REQUEST_ID_TEST_ENABLED='false',NEWS_IMPORT_SCHEDULER_ENABLED='false',NEWS_IMPORT_PROVIDER='fake',WORKER_RUN_STARTUP_TEST='false')
 for i in range(40):
  if subprocess.run(D+['exec',names[0],'pg_isready','-U','audit'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:break
  time.sleep(.5)
 for args,label in [(['exec','prisma','validate'],'schema'),(['exec','prisma','migrate','deploy'],'migrate'),(['seed'],'seed')]:
  with open(out/(label+'.log'),'w') as f:run(['pnpm','--filter','@kurvenfunk/database']+args,env=env,stdout=f,stderr=subprocess.STDOUT,cwd='/workspace/kurvenfunk')
 with open(out/'integration.log','w') as f:run(['node',str(out/'integration.cjs')],env=env,stdout=f,stderr=subprocess.STDOUT,cwd='/workspace/kurvenfunk')
finally:
 for name in reversed(names):subprocess.run(D+['rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print('Owned containers removed')
