// DEV-only S3 read inventory. No mutations and no object keys or bucket names in logs.
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ListMultipartUploadsCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.STORAGE_ENDPOINT;
const bucket = process.env.STORAGE_BUCKET;
const accessKeyId = process.env.STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.STORAGE_SECRET_KEY;
if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  throw new Error('DEV_S3_READONLY_CONFIG_MISSING');
}
const target = new URL(endpoint);
if (
  target.hostname !== 'minio' ||
  target.port !== '9000' ||
  !['http:', 'https:'].includes(target.protocol)
) {
  throw new Error('DEV_S3_READONLY_ENDPOINT_NOT_ISOLATED');
}
const client = new S3Client({
  endpoint,
  region: process.env.STORAGE_REGION || 'us-east-1',
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false',
});

async function paged(command, more, marker) {
  let page = 0;
  let token = {};
  let result = 0;
  while (true) {
    page += 1;
    if (page > 100000) throw new Error('DEV_S3_READONLY_PAGINATION_OVERFLOW');
    const response = await client.send(new command({ ...more, ...token, MaxKeys: 1000 }));
    result += marker.count(response);
    if (!response.IsTruncated) return result;
    token = marker.next(response);
    if (!token || !Object.values(token).some(Boolean)) {
      throw new Error('DEV_S3_READONLY_MISSING_CONTINUATION');
    }
  }
}
try {
  const response = await client.send(new ListBucketsCommand({}));
  if (!Array.isArray(response.Buckets)) throw new Error('DEV_S3_READONLY_BUCKET_LIST_INVALID');
  const buckets = response.Buckets.map((b) => b.Name);
  if (!buckets.every((b) => typeof b === 'string' && b.length > 0) || !buckets.includes(bucket)) {
    throw new Error('DEV_S3_READONLY_APP_BUCKET_NOT_FOUND');
  }
  let visible = 0;
  let versions = 0;
  let deleteMarkers = 0;
  let multipart = 0;
  let otherVisible = 0;
  let otherVersions = 0;
  for (const name of buckets) {
    const current = await paged(
      ListObjectsV2Command,
      { Bucket: name },
      {
        count: (d) => (d.Contents || []).length,
        next: (d) => ({ ContinuationToken: d.NextContinuationToken }),
      },
    );
    const allVersions = await paged(
      ListObjectVersionsCommand,
      { Bucket: name },
      {
        count: (d) => {
          deleteMarkers += (d.DeleteMarkers || []).length;
          return (d.Versions || []).length;
        },
        next: (d) => ({
          KeyMarker: d.NextKeyMarker,
          VersionIdMarker: d.NextVersionIdMarker,
        }),
      },
    );
    multipart += await paged(
      ListMultipartUploadsCommand,
      { Bucket: name },
      {
        count: (d) => (d.Uploads || []).length,
        next: (d) => ({
          KeyMarker: d.NextKeyMarker,
          UploadIdMarker: d.NextUploadIdMarker,
        }),
      },
    );
    visible += current;
    versions += allVersions;
    if (name !== bucket) {
      otherVisible += current;
      otherVersions += allVersions;
    }
  }
  console.log('DEV_MINIO_BUCKETS_ALL=' + buckets.length);
  console.log('DEV_MINIO_BUCKETS_EXTRA=' + (buckets.length - 1));
  console.log('DEV_MINIO_OBJECTS_VISIBLE_ALL=' + visible);
  console.log('DEV_MINIO_OBJECT_VERSIONS_ALL=' + versions);
  console.log('DEV_MINIO_DELETE_MARKERS_ALL=' + deleteMarkers);
  console.log('DEV_MINIO_MULTIPART_UPLOADS_ALL=' + multipart);
  console.log('DEV_MINIO_EXTRA_BUCKET_OBJECTS=' + otherVisible);
  console.log('DEV_MINIO_EXTRA_BUCKET_VERSIONS=' + otherVersions);
  console.log('DEV_MINIO_DEEP_INVENTORY=PASS_READ_ONLY');
} finally {
  client.destroy();
}
