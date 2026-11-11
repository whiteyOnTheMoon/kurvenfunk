#!/usr/bin/env bash
# Strictly read-only aggregate inventory of isolated DEV services.
set -Eeuo pipefail
set +x
umask 077
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact develop commit required}"
[[ "$DEV_RESIDUAL_TARGET" == DEV ]] || { echo "ERROR: DEV_ONLY"; exit 1; }
cd "$PROJECT_DIR"
[[ -f .env.dev && ! -L .env.dev && "$(git branch --show-current)" == develop ]] || { echo "ERROR: INVALID_DEV_CHECKOUT"; exit 1; }
[[ -z "$(git status --porcelain)" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || { echo "ERROR: STALE_DEV_CHECKOUT"; exit 1; }
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || { echo "ERROR: REMOTE_HEAD_MOVED"; exit 1; }
exec 9>/tmp/kurvenfunk-dev-deploy.lock
flock -n 9 || { echo "ERROR: DEV_DEPLOY_BUSY"; exit 1; }
exec 8>/tmp/kurvenfunk-dev-full-application-reset.lock
flock -n 8 || { echo "ERROR: DEV_RESET_BUSY"; exit 1; }
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet

echo "DEV_RESIDUAL_INVENTORY=READ_ONLY"
echo "DEV_RESIDUAL_COMMIT=$EXPECTED_COMMIT"
for service in postgres keycloak api redis minio meilisearch mailpit worker; do
  [[ -n "$("${compose[@]}" ps -q "$service")" ]] || { echo "ERROR: SERVICE_MISSING=$service"; exit 1; }
done

# Keycloak: aggregated realm users only; never print subjects or private user fields.
appdb="$("${compose[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
kc_url="$("${compose[@]}" exec -T keycloak printenv KC_DB_URL | tr -d '\r')"
[[ "$appdb" =~ ^[A-Za-z0-9_]+$ && "$kc_url" =~ ^jdbc:postgresql://postgres:5432/([A-Za-z0-9_]+)$ ]] || { echo "ERROR: UNEXPECTED_DATABASE_TARGETS"; exit 1; }
kc_db="${BASH_REMATCH[1]}"
[[ "$kc_db" != "$appdb" ]] || { echo "ERROR: KEYCLOAK_DB_NOT_ISOLATED"; exit 1; }
sql="SELECT 'KEYCLOAK_DEV_REALM_USERS=' || COUNT(*) FROM user_entity u JOIN realm r ON u.realm_id=r.id WHERE r.name='kurvenfunk'; SELECT 'KEYCLOAK_DEV_SERVICE_USERS=' || COUNT(*) FROM user_entity u JOIN realm r ON u.realm_id=r.id WHERE r.name='kurvenfunk' AND u.username LIKE 'service-account-%'; SELECT 'KEYCLOAK_MASTER_USERS=' || COUNT(*) FROM user_entity u JOIN realm r ON u.realm_id=r.id WHERE r.name='master'; SELECT 'KEYCLOAK_DEV_REALM_COUNT=' || COUNT(*) FROM realm WHERE name='kurvenfunk';"
"${compose[@]}" exec -T postgres sh -ec 'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -A -t -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" -c "$2"' sh "$kc_db" "$sql"

# Redis: count keys only (no names, no credential output).
size="$("${compose[@]}" exec -T redis sh -ec 'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli --raw DBSIZE' | tr -d '\r')"
[[ "$size" =~ ^[0-9]+$ ]] || { echo "ERROR: INVALID_REDIS_DBSIZE"; exit 1; }
echo "REDIS_DEV_KEYS=$size"

# MinIO: enumerate every key in the configured application bucket using the app's existing S3 client.
"${compose[@]}" exec -T api node --input-type=module - <<'NODE'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
const bucket = process.env.STORAGE_BUCKET;
if (!bucket || !process.env.STORAGE_ENDPOINT || !process.env.STORAGE_ACCESS_KEY || !process.env.STORAGE_SECRET_KEY) {
  throw new Error('MINIO_INVENTORY_CONFIGURATION_MISSING');
}
const client = new S3Client({
  region: process.env.STORAGE_REGION || 'us-east-1',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false',
});
let token;
let objects = 0;
let bytes = 0;
do {
  const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }));
  objects += result.Contents?.length ?? 0;
  bytes += (result.Contents ?? []).reduce((sum, x) => sum + (x.Size ?? 0), 0);
  token = result.NextContinuationToken;
} while (token);
client.destroy();
console.log('MINIO_CONFIGURED_BUCKET_OBJECTS=' + objects);
console.log('MINIO_CONFIGURED_BUCKET_BYTES=' + bytes);
console.log('MINIO_OTHER_BUCKETS=NOT_CHECKED');
console.log('MINIO_VERSIONS=NOT_CHECKED');
NODE

# Meilisearch & Mailpit: local-only HTTP endpoints; never echo responses, API keys or message contents.
python3 - <<'PY'
import json
import subprocess
import urllib.request

compose = ['docker', 'compose', '-p', 'kurvenfunk-dev', '--env-file', '.env.dev',
           '-f', 'compose.yml', '-f', 'compose.dev.yml']
key = subprocess.check_output(
    compose + ['exec', '-T', 'meilisearch', 'printenv', 'MEILI_MASTER_KEY'],
    stderr=subprocess.DEVNULL, timeout=20).decode().strip()
if not key:
    raise SystemExit('ERROR: MEILI_KEY_MISSING')
request = urllib.request.Request(
    'http://127.0.0.1:3103/stats',
    headers={'Authorization': 'Bearer ' + key})
with urllib.request.urlopen(request, timeout=15) as resp:
    stats = json.load(resp)
indexes = stats.get('indexes')
if not isinstance(indexes, dict):
    raise SystemExit('ERROR: INVALID_MEILI_STATS')
print('MEILI_INDEXES=' + str(len(indexes)))
print('MEILI_DOCUMENTS=' + str(sum(int(i['numberOfDocuments']) for i in indexes.values())))

with urllib.request.urlopen('http://127.0.0.1:3107/api/v1/messages?limit=1', timeout=15) as resp:
    messages = json.load(resp)
total = messages.get('total')
if type(total) is not int or total < 0:
    raise SystemExit('ERROR: UNEXPECTED_MAILPIT_COUNT_FORMAT')
print('MAILPIT_MESSAGES=' + str(total))
PY

echo "DEV_RESIDUAL_INVENTORY_RESULT=PASS_READ_ONLY"
