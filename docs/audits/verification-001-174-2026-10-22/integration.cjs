const {createRequire}=require('node:module');
const req=createRequire('/workspace/kurvenfunk/apps/api/package.json');
const wreq=createRequire('/workspace/kurvenfunk/apps/worker/package.json');
const {writeFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const http=require('node:http');
const root='/workspace/kurvenfunk/';
const results=[];
async function check(name,fn){try{const detail=await fn();results.push({name,pass:true,detail});}catch(e){results.push({name,pass:false,error:e.message});} }
(async()=>{
 const {generateKeyPair,exportJWK,SignJWT}=await req('jose');
 const {publicKey,privateKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='audit';jwk.alg='RS256';
 const jwks=http.createServer((q,s)=>{s.setHeader('content-type','application/json');s.end(JSON.stringify({keys:[jwk]}))});await new Promise(r=>jwks.listen(0,'127.0.0.1',r));
 const issuer=`http://127.0.0.1:${jwks.address().port}/realms/audit`;
 process.env.KEYCLOAK_ISSUER=issuer;process.env.KEYCLOAK_JWKS_URL=issuer+'/certs';process.env.KEYCLOAK_AUDIENCE='audit';
 const {NestFactory}=req('@nestjs/core');
 const {createPrismaClient}=req('@kurvenfunk/database');const db=createPrismaClient();
 let app,worker,queue,events;
 try{
 app=await NestFactory.create(req(root+'apps/api/dist/app.module.js').AppModule,{logger:false});
 app.setGlobalPrefix('api/v1');app.useGlobalFilters(new (req(root+'apps/api/dist/common/filters/http-exception.filter.js').HttpExceptionFilter)());app.useGlobalInterceptors(new (req(root+'apps/api/dist/common/interceptors/response.interceptor.js').ResponseInterceptor)());
 await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 async function token(sub='audit-active',claims={}){return new SignJWT({email_verified:true,...claims}).setProtectedHeader({alg:'RS256',kid:'audit'}).setSubject(sub).setIssuer(issuer).setAudience('audit').setIssuedAt().setExpirationTime('10m').sign(privateKey)}
 async function call(path,method='GET',body,t){const r=await fetch(base+'/api/v1'+path,{method,headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()}}
 let active=await token(),second=await token('audit-second');let uid,cid,replyId;const article=await db.article.findFirst({where:{status:'PUBLISHED',deletedAt:null}});assert(article);
 await check('HTTP live/ready real PostgreSQL and Redis',async()=>{for(const p of ['/health/live','/health/ready'])assert.equal((await call(p)).status,200)});
 await check('Auth rejects missing malformed unverified expired wrong issuer audience signature',async()=>{
  assert.equal((await call('/auth/me')).status,401);assert.equal((await call('/auth/me','GET',null,'malformed')).status,401);
  for(const c of [{email_verified:false}])assert.equal((await call('/auth/me','GET',null,await token('audit-unverified',c))).status,401);
  for(const mode of ['expired','issuer','audience','signature']){let p=privateKey;if(mode==='signature')p=(await generateKeyPair('RS256')).privateKey;const t=await new SignJWT({email_verified:true}).setProtectedHeader({alg:'RS256',kid:'audit'}).setSubject('invalid').setIssuer(mode==='issuer'?'http://invalid.test':issuer).setAudience(mode==='audience'?'wrong':'audit').setExpirationTime(mode==='expired'?0:'10m').sign(p);assert.equal((await call('/auth/me','GET',null,t)).status,401)}
 });
 await check('Real JWT user sync persists UNSET incomplete defaults',async()=>{const r=await call('/auth/me','GET',null,active);assert.equal(r.status,200);uid=r.body.data.id;assert.equal(r.body.data.onboardingCompleted,false);assert.equal(r.body.data.fanPreference,'UNSET')});
 await check('DEFECT: incomplete onboarding user can create comment via HTTP',async()=>{const r=await call(`/articles/${article.id}/comments`,'POST',{body:'Audit pre onboarding comment'},active);assert.equal(r.status,201);cid=r.body.data.id;assert.equal((await db.user.findUnique({where:{id:uid}})).onboardingCompleted,false);return '201 confirms missing server onboarding gate, not acceptance success'});
 await check('Comment spam actual Redis rejects duplicate and cooldown',async()=>{assert.equal((await call(`/articles/${article.id}/comments`,'POST',{body:'Audit pre onboarding comment'},active)).status,409);assert.equal((await call(`/articles/${article.id}/comments`,'POST',{body:'Another audit comment'},active)).status,429)});
 await check('Onboarding neutral persisted and nickname case insensitive conflict',async()=>{assert.equal((await call('/onboarding/complete','PATCH',{nickname:'AuditAlpha',fanPreference:'NEUTRAL',favoriteClubId:null},active)).status,200);await call('/auth/me','GET',null,second);assert.equal((await call('/onboarding/complete','PATCH',{nickname:'auditalpha',fanPreference:'NEUTRAL',favoriteClubId:null},second)).status,409)});
 await check('Favorite club changes persisted then neutral restored',async()=>{const club=await db.club.findFirst({where:{active:true}});assert.equal((await call('/profiles/me/fan-preference','PATCH',{fanPreference:'CLUB',favoriteClubId:club.id},active)).status,200);assert.equal((await db.user.findUnique({where:{id:uid}})).favoriteClubId,club.id);assert.equal((await call('/profiles/me/fan-preference','PATCH',{fanPreference:'NEUTRAL',favoriteClubId:null},active)).status,200)});
 await check('Comment edit revision and foreign author denial real DB',async()=>{assert.equal((await call(`/articles/${article.id}/comments/${cid}`,'PATCH',{body:'Audit edited'},second)).status,403);assert.equal((await call(`/articles/${article.id}/comments/${cid}`,'PATCH',{body:'Audit edited'},active)).status,200);assert.equal(await db.commentRevision.count({where:{commentId:cid}}),1)});
 await check('ACTIVE reply real parent relation',async()=>{const r=await call(`/articles/${article.id}/comments/${cid}/replies`,'POST',{body:'Audit reply'},second);assert.equal(r.status,201);replyId=r.body.data.id;assert.equal((await db.comment.findUnique({where:{id:replyId}})).parentId,cid)});
 await check('LIMITED cannot post but can vote; BANNED cannot authenticate',async()=>{await db.user.update({where:{id:uid},data:{status:'LIMITED'}});assert.equal((await call(`/articles/${article.id}/comments`,'POST',{body:'Limited denied'},active)).status,403);assert.equal((await call(`/comments/${replyId}/votes`,'PUT',{type:'UPVOTE'},active)).status,200);await db.user.update({where:{id:uid},data:{status:'BANNED'}});assert.equal((await call('/auth/me','GET',null,active)).status,403);await db.user.update({where:{id:uid},data:{status:'ACTIVE'}})});
 await check('Reports persisted and duplicate rejected',async()=>{assert.equal((await call(`/comments/${cid}/reports`,'POST',{reason:'SPAM'},second)).status,201);assert.equal((await call(`/comments/${cid}/reports`,'POST',{reason:'SPAM'},second)).status,409)});
 await check('Comments all sort SQL and invalid cursor validation',async()=>{for(const sort of ['newest','oldest','popular'])assert.equal((await call(`/articles/${article.id}/comments?sort=${sort}`)).status,200);assert.equal((await call(`/articles/${article.id}/comments?cursor=bad`)).status,400)});
 await check('Soft delete persists tombstone',async()=>{assert.equal((await call(`/articles/${article.id}/comments/${cid}`,'DELETE',null,active)).status,200);assert((await db.comment.findUnique({where:{id:cid}})).deletedAt)});
 await check('Diagnostic route disabled before queue action',async()=>assert.equal((await call('/request-id-test/queue','POST',{})).status,404));

 await check('Editorial real HTTP CRUD relations workflow revisions archive delete restore',async()=>{
 const u=await db.user.findUnique({where:{keycloakSubject:'seed-editor-user'}});const editor=await token(u.keycloakSubject);const club=await db.club.findFirst({where:{active:true}});const match=await db.match.findFirst();const cat=await db.category.findFirst();const tag=await db.tag.findFirst();
 const r=await call('/articles','POST',{title:'Audit article',slug:'audit-editorial',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Audit content'}]}]},clubIds:[club.id],competitionId:match.competitionId,matchId:match.id,categoryIds:cat?[cat.id]:[],tagIds:tag?[tag.id]:[],seoTitle:'Audit SEO',seoDescription:'Audit description',canonicalUrl:'https://audit.invalid/article'},editor);assert.equal(r.status,201,JSON.stringify(r.body));const id=r.body.data.id;
 assert.equal((await call('/articles/'+id,'PATCH',{title:'Audit edited'},editor)).status,200);assert(await db.articleRevision.count({where:{articleId:id}})>0);
 for(const status of ['REVIEW','PUBLISHED'])assert.equal((await call('/articles/'+id+'/publication','PATCH',{status},editor)).status,200);
 assert.equal((await call('/articles/by-slug/audit-editorial')).status,200);
 assert.equal((await call('/articles/'+id+'/archive','POST',{},editor)).status,201);
 assert.equal((await call('/articles/'+id,'DELETE',null,editor)).status,200);assert((await db.article.findUnique({where:{id}})).deletedAt);
 assert.equal((await call('/articles/'+id+'/restore','POST',{},editor)).status,201);assert.equal((await db.article.findUnique({where:{id}})).deletedAt,null)
 });
 await check('DEFECT: invalid public media UUID returns 500',async()=>assert.equal((await call('/media/not-a-uuid/content')).status,500));
 worker=await NestFactory.createApplicationContext(wreq(root+'apps/worker/dist/app.module.js').AppModule,{logger:false});
 const {Queue,QueueEvents}=wreq('bullmq');const conn={host:process.env.REDIS_HOST,port:Number(process.env.REDIS_PORT),password:process.env.REDIS_PASSWORD};queue=new Queue('news-import',{connection:conn});events=new QueueEvents('news-import',{connection:conn});await events.waitUntilReady();
 await check('Real BullMQ fake provider full pipeline and second-run duplicate detection',async()=>{let j=await queue.add('fetch-provider',{providerKey:'fake'});await j.waitUntilFinished(events,30000);assert.equal(await db.rawPayload.count(),5);const state1=await db.importRecord.groupBy({by:['status'],_count:true});j=await queue.add('fetch-provider',{providerKey:'fake'});await j.waitUntilFinished(events,30000);assert.equal(await db.rawPayload.count(),10);const state2=await db.importRecord.groupBy({by:['status'],_count:true});assert(await db.importRecord.count({where:{status:'DUPLICATE'}})>0);return {state1,state2,articles:await db.article.count()}});

 await check('DEFECT: review approval persists decision but creates no article',async()=>{const r=await db.importRecord.findFirst({where:{status:'REVIEW_REQUIRED'}});assert(r);const before=await db.article.count();const {ImportsService}=req(root+'apps/api/dist/modules/imports/imports.service.js');const s=app.get(ImportsService);await s.approveReview(r.id,uid);assert.equal((await db.importRecord.findUnique({where:{id:r.id}})).status,'MATCHED');assert.equal(await db.article.count(),before);return 'Approved record has no canonical article; no continuation exists in source'});
 await check('Real SQL cursor traverses more than one page without repeated root IDs',async()=>{await db.comment.createMany({data:Array.from({length:25},(_,i)=>({articleId:article.id,authorId:uid,body:'Pagination fixture '+i}))});for(const sort of ['newest','oldest','popular']){const a=await call(`/articles/${article.id}/comments?sort=${sort}`);const d=a.body.data;assert(d.pagination.nextCursor,JSON.stringify(d));const b=await call(`/articles/${article.id}/comments?sort=${sort}&cursor=${encodeURIComponent(d.pagination.nextCursor)}`);assert.equal(b.status,200);assert(d.items.every(x=>!b.body.data.items.some(y=>y.id===x.id)))}});
 await check('Scheduled publishing updates due article once real DB',async()=>{const a=await db.article.create({data:{title:'Audit schedule',slug:'audit-schedule',content:{type:'doc',content:[]},status:'SCHEDULED',scheduledAt:new Date(Date.now()-1000)}});const {ScheduledPublishingService}=wreq(root+'apps/worker/dist/services/scheduled-publishing.service.js');const s=worker.get(ScheduledPublishingService);assert.equal(await s.publishDueArticles(),1);assert.equal(await s.publishDueArticles(),0);assert.equal((await db.article.findUnique({where:{id:a.id}})).status,'PUBLISHED')});
 }finally{if(events)await events.close();if(queue)await queue.close();if(worker)await worker.close();if(app)await app.close();await db.$disconnect();await new Promise(r=>jwks.close(r));writeFileSync('/workspace/kurvenfunk-verification-2026-10-22/integration-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2))}
 if(results.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
