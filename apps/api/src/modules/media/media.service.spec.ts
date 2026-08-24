import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createPrismaClient } from '@kurvenfunk/database';

import type { StoragePutInput, StorageService } from '../../infrastructure/storage/storage.types';
import { MediaService } from './media.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const mockedCreatePrismaClient = jest.mocked(createPrismaClient);

interface MediaCreateData {
  storageType: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  altText: string | null;
  copyright: string | null;
  source: string | null;
  sourceUrl: string | null;
}

interface MediaCreateArgs {
  data: MediaCreateData;
}

describe('MediaService', () => {
  const mediaCreate = jest.fn();
  const mediaFindFirst = jest.fn();

  const database = {
    media: {
      create: mediaCreate,
      findFirst: mediaFindFirst,
    },
  };

  const storagePut = jest.fn();
  const storageGet = jest.fn();
  const storageDelete = jest.fn();

  const storage: StorageService = {
    put: storagePut,
    get: storageGet,
    delete: storageDelete,
  };

  const file = {
    originalname: 'rapid.webp',
    mimetype: 'image/webp',
    size: 1234,
    buffer: Buffer.from('test-image'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreatePrismaClient.mockReturnValue(database as never);
  });

  it('uploads an image and creates the media record', async () => {
    let capturedPutInput: StoragePutInput | undefined;

    storagePut.mockImplementation((input: StoragePutInput) => {
      capturedPutInput = input;

      return Promise.resolve({
        key: input.key,
      });
    });

    mediaCreate.mockImplementation(({ data }: MediaCreateArgs) =>
      Promise.resolve({
        id: 'b102a9df-1929-4600-b068-c415abb5c937',
        storageType: 'INTERNAL',
        storageKey: data.storageKey,
        externalUrl: null,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: null,
        height: null,
        altText: data.altText,
        copyright: data.copyright,
        source: data.source,
        sourceUrl: data.sourceUrl,
        status: 'ACTIVE',
        createdAt: new Date('2026-08-24T12:00:00.000Z'),
        updatedAt: new Date('2026-08-24T12:00:00.000Z'),
      }),
    );

    const service = new MediaService(storage);

    const result = await service.upload(file, {
      altText: 'Rapid',
      copyright: null,
      source: null,
      sourceUrl: null,
    });

    expect(storagePut).toHaveBeenCalledTimes(1);

    expect(capturedPutInput).toBeDefined();
    expect(capturedPutInput?.key).toMatch(/^media\/\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/);
    expect(capturedPutInput?.contentType).toBe('image/webp');
    expect(capturedPutInput?.body).toBe(file.buffer);

    expect(mediaCreate).toHaveBeenCalledWith({
      data: {
        storageType: 'INTERNAL',
        storageKey: capturedPutInput?.key,
        originalFileName: 'rapid.webp',
        mimeType: 'image/webp',
        sizeBytes: 1234n,
        altText: 'Rapid',
        copyright: null,
        source: null,
        sourceUrl: null,
      },
    });

    expect(result).toMatchObject({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      storageType: 'INTERNAL',
      originalFileName: 'rapid.webp',
      mimeType: 'image/webp',
      sizeBytes: 1234,
      altText: 'Rapid',
      contentUrl: '/api/v1/media/b102a9df-1929-4600-b068-c415abb5c937/content',
    });
  });

  it('rejects an unsupported media type before writing to storage', async () => {
    const service = new MediaService(storage);

    await expect(
      service.upload(
        {
          ...file,
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
        },
        {
          altText: null,
          copyright: null,
          source: null,
          sourceUrl: null,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storagePut).not.toHaveBeenCalled();
    expect(mediaCreate).not.toHaveBeenCalled();
  });

  it('rejects an empty file', async () => {
    const service = new MediaService(storage);

    await expect(
      service.upload(
        {
          ...file,
          size: 0,
          buffer: Buffer.alloc(0),
        },
        {
          altText: null,
          copyright: null,
          source: null,
          sourceUrl: null,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storagePut).not.toHaveBeenCalled();
  });

  it('deletes the storage object if database creation fails', async () => {
    let capturedPutInput: StoragePutInput | undefined;

    storagePut.mockImplementation((input: StoragePutInput) => {
      capturedPutInput = input;

      return Promise.resolve({
        key: input.key,
      });
    });
    storageDelete.mockResolvedValue(undefined);
    mediaCreate.mockRejectedValue(new Error('database failed'));

    const service = new MediaService(storage);

    await expect(
      service.upload(file, {
        altText: null,
        copyright: null,
        source: null,
        sourceUrl: null,
      }),
    ).rejects.toThrow('database failed');

    expect(storagePut).toHaveBeenCalledTimes(1);
    expect(storageDelete).toHaveBeenCalledTimes(1);

    expect(capturedPutInput).toBeDefined();
    expect(storageDelete).toHaveBeenCalledWith(capturedPutInput?.key);
  });

  it('returns stored media content', async () => {
    mediaFindFirst.mockResolvedValue({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      storageType: 'INTERNAL',
      storageKey: 'media/2026/08/test.webp',
      mimeType: 'image/webp',
      sizeBytes: 1234n,
      status: 'ACTIVE',
    });

    storageGet.mockResolvedValue({
      body: Buffer.from('stored-image'),
      contentType: 'image/webp',
    });

    const service = new MediaService(storage);

    const result = await service.getContent('b102a9df-1929-4600-b068-c415abb5c937');

    expect(mediaFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'b102a9df-1929-4600-b068-c415abb5c937',
        status: 'ACTIVE',
      },
    });

    expect(storageGet).toHaveBeenCalledWith('media/2026/08/test.webp');

    expect(result).toEqual({
      body: Buffer.from('stored-image'),
      mimeType: 'image/webp',
      sizeBytes: 1234,
    });
  });

  it('rejects missing media content', async () => {
    mediaFindFirst.mockResolvedValue(null);

    const service = new MediaService(storage);

    await expect(service.getContent('b102a9df-1929-4600-b068-c415abb5c937')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(storageGet).not.toHaveBeenCalled();
  });
});
