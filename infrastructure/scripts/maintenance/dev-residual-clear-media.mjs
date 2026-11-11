// Executed only inside the DEV API container after guarded backup and explicit apply.
// Never prints media keys or secret values. The application bucket and settings survive.
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';

if (process.env.DEV_RESIDUAL_DELETE_CONFIRM !== 'CLEAR_DEV_ONLY_RESIDUAL_DATA') {
  throw new Error('DEV_RESIDUAL_APPLY_NOT_AUTHORIZED');
}
const bucket = process.env.STORAGE_BUCKET;
if (
  !bucket ||
  !process.env.STORAGE_ENDPOINT ||
  !process.env.STORAGE_ACCESS_KEY ||
  !process.env.STORAGE_SECRET_KEY
) {
  throw new Error('INVALID_DEV_MEDIA_CONFIGURATION');
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
let versionsRemoved = 0;
let objectsRemoved = 0;
let uploadsAborted = 0;
let passes = 0;
async function deleteBatch(entries) {
  if (!entries.length) return;
  const output = await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: entries, Quiet: true },
    }),
  );
  if (output.Errors?.length) throw new Error('MINIO_BATCH_DELETE_FAILED');
}
try {
  // Always reread the first page after each batch: deleting while cursor-paginating skips objects.
  while (true) {
    if (++passes > 100000) throw new Error('MINIO_VERSION_CLEAR_LIMIT');
    const page = await client.send(
      new ListObjectVersionsCommand({ Bucket: bucket, MaxKeys: 1000 }),
    );
    const entries = [
      ...(page.Versions ?? []),
      ...(page.DeleteMarkers ?? []),
    ].map((v) => ({ Key: v.Key, VersionId: v.VersionId }));
    if (!entries.length) break;
    await deleteBatch(entries);
    versionsRemoved += entries.length;
  }
  passes = 0;
  while (true) {
    if (++passes > 100000) throw new Error('MINIO_OBJECT_CLEAR_LIMIT');
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1000 }),
    );
    const entries = (page.Contents ?? []).map((v) => ({ Key: v.Key }));
    if (!entries.length) break;
    await deleteBatch(entries);
    objectsRemoved += entries.length;
  }
  passes = 0;
  while (true) {
    if (++passes > 100000) throw new Error('MINIO_MULTIPART_CLEAR_LIMIT');
    const page = await client.send(
      new ListMultipartUploadsCommand({ Bucket: bucket, MaxUploads: 1000 }),
    );
    const uploads = page.Uploads ?? [];
    if (!uploads.length) break;
    for (const upload of uploads) {
      await client.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: upload.Key,
          UploadId: upload.UploadId,
        }),
      );
      uploadsAborted++;
    }
  }
  const finalVersions = await client.send(
    new ListObjectVersionsCommand({ Bucket: bucket, MaxKeys: 1 }),
  );
  const finalObjects = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }),
  );
  const finalUploads = await client.send(
    new ListMultipartUploadsCommand({ Bucket: bucket, MaxUploads: 1 }),
  );
  if (
    (finalVersions.Versions?.length ?? 0) +
      (finalVersions.DeleteMarkers?.length ?? 0) +
      (finalObjects.Contents?.length ?? 0) +
      (finalUploads.Uploads?.length ?? 0) !==
    0
  ) {
    throw new Error('MINIO_RESIDUAL_MEDIA_REMAIN');
  }
  console.log('DEV_MINIO_VERSIONS_REMOVED=' + versionsRemoved);
  console.log('DEV_MINIO_OBJECTS_REMOVED=' + objectsRemoved);
  console.log('DEV_MINIO_MULTIPART_ABORTED=' + uploadsAborted);
  console.log('DEV_MINIO_APPLICATION_BUCKET_EMPTY=YES');
} finally {
  client.destroy();
}
