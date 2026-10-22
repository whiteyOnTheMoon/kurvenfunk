import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  StorageGetResult,
  StoragePutInput,
  StoragePutResult,
  StorageService,
} from './storage.types';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('STORAGE_ENDPOINT');
    const region = this.configService.get<string>('STORAGE_REGION', 'us-east-1');
    const accessKeyId = this.configService.getOrThrow<string>('STORAGE_ACCESS_KEY');
    const secretAccessKey = this.configService.getOrThrow<string>('STORAGE_SECRET_KEY');

    this.bucket = this.configService.getOrThrow<string>('STORAGE_BUCKET');

    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: this.configService.get<boolean>('STORAGE_FORCE_PATH_STYLE', true),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async put(input: StoragePutInput): Promise<StoragePutResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return {
      key: input.key,
    };
  }

  async get(key: string): Promise<StorageGetResult> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error(`Storage object ${key} has no body`);
    }

    return {
      body: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
