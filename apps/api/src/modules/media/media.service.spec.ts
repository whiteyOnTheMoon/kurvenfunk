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
  const mediaFindMany = jest.fn();
  const mediaUpdate = jest.fn();

  const database = {
    media: {
      create: mediaCreate,
      findFirst: mediaFindFirst,
      findMany: mediaFindMany,
      update: mediaUpdate,
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

  it('lists active media with usage counts and pagination', async () => {
    mediaFindMany.mockResolvedValue([
      {
        id: 'b102a9df-1929-4600-b068-c415abb5c937',
        storageType: 'INTERNAL',
        storageKey: 'media/2026/08/first.webp',
        externalUrl: null,
        originalFileName: 'first.webp',
        mimeType: 'image/webp',
        sizeBytes: 1234n,
        width: null,
        height: null,
        altText: 'First image',
        copyright: null,
        source: null,
        sourceUrl: null,
        status: 'ACTIVE',
        createdAt: new Date('2026-08-24T12:00:00.000Z'),
        updatedAt: new Date('2026-08-24T12:00:00.000Z'),
        _count: {
          profileAvatars: 1,
          clubLogos: 2,
          articleLeads: 3,
        },
      },
      {
        id: '4f8aa214-febd-4c5c-baf4-d1e86da29f37',
        storageType: 'INTERNAL',
        storageKey: 'media/2026/08/second.webp',
        externalUrl: null,
        originalFileName: 'second.webp',
        mimeType: 'image/webp',
        sizeBytes: 2345n,
        width: null,
        height: null,
        altText: 'Second image',
        copyright: null,
        source: null,
        sourceUrl: null,
        status: 'ACTIVE',
        createdAt: new Date('2026-08-23T12:00:00.000Z'),
        updatedAt: new Date('2026-08-23T12:00:00.000Z'),
        _count: {
          profileAvatars: 0,
          clubLogos: 0,
          articleLeads: 0,
        },
      },
    ]);

    const service = new MediaService(storage);

    const result = await service.list({
      limit: 1,
    });

    expect(mediaFindMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 2,
      include: {
        _count: {
          select: {
            profileAvatars: true,
            clubLogos: true,
            articleLeads: true,
          },
        },
      },
    });

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'b102a9df-1929-4600-b068-c415abb5c937',
          sizeBytes: 1234,
          contentUrl: '/api/v1/media/b102a9df-1929-4600-b068-c415abb5c937/content',
          usage: {
            profileAvatars: 1,
            clubLogos: 2,
            articleLeads: 3,
            total: 6,
          },
        }),
      ],
      nextCursor: 'b102a9df-1929-4600-b068-c415abb5c937',
    });
  });

  it('uses a cursor when listing media', async () => {
    mediaFindMany.mockResolvedValue([]);

    const service = new MediaService(storage);

    const cursor = 'b102a9df-1929-4600-b068-c415abb5c937';

    const result = await service.list({
      cursor,
      limit: 30,
    });

    expect(mediaFindMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 31,
      cursor: {
        id: cursor,
      },
      skip: 1,
      include: {
        _count: {
          select: {
            profileAvatars: true,
            clubLogos: true,
            articleLeads: true,
          },
        },
      },
    });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('returns a media item with detailed usage', async () => {
    mediaFindFirst.mockResolvedValue({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      storageType: 'INTERNAL',
      storageKey: 'media/2026/08/test.webp',
      externalUrl: null,
      originalFileName: 'test.webp',
      mimeType: 'image/webp',
      sizeBytes: 1234n,
      width: null,
      height: null,
      altText: 'Rapid',
      copyright: 'Kurvenfunk',
      source: 'Redaktion',
      sourceUrl: 'https://kurvenfunk.at',
      status: 'ACTIVE',
      createdAt: new Date('2026-08-24T12:00:00.000Z'),
      updatedAt: new Date('2026-08-24T12:00:00.000Z'),
      profileAvatars: [
        {
          id: '797e5126-9fb3-4360-bd47-a5d305f6229e',
          userId: 'a55be870-29d5-4e66-9640-d6c12e5846cd',
        },
      ],
      clubLogos: [
        {
          id: '9377bfd3-ac3f-4830-a318-6115b674f474',
          name: 'SK Rapid Wien',
          slug: 'sk-rapid-wien',
        },
      ],
      articleLeads: [
        {
          id: '2493d081-65d0-463c-b899-f34532c075c7',
          title: 'Rapid gewinnt',
          slug: 'rapid-gewinnt',
        },
      ],
    });

    const service = new MediaService(storage);

    const result = await service.getById('b102a9df-1929-4600-b068-c415abb5c937');

    expect(mediaFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'b102a9df-1929-4600-b068-c415abb5c937',
        status: 'ACTIVE',
      },
      include: {
        profileAvatars: {
          select: {
            id: true,
            userId: true,
          },
        },
        clubLogos: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        articleLeads: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    expect(result).toMatchObject({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      altText: 'Rapid',
      usage: {
        profileAvatars: [
          {
            id: '797e5126-9fb3-4360-bd47-a5d305f6229e',
            userId: 'a55be870-29d5-4e66-9640-d6c12e5846cd',
          },
        ],
        clubLogos: [
          {
            id: '9377bfd3-ac3f-4830-a318-6115b674f474',
            name: 'SK Rapid Wien',
            slug: 'sk-rapid-wien',
          },
        ],
        articleLeads: [
          {
            id: '2493d081-65d0-463c-b899-f34532c075c7',
            title: 'Rapid gewinnt',
            slug: 'rapid-gewinnt',
          },
        ],
        total: 3,
      },
    });
  });

  it('rejects a missing media item when loading details', async () => {
    mediaFindFirst.mockResolvedValue(null);

    const service = new MediaService(storage);

    await expect(service.getById('b102a9df-1929-4600-b068-c415abb5c937')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates editable media metadata', async () => {
    mediaFindFirst.mockResolvedValue({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
    });

    mediaUpdate.mockResolvedValue({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      storageType: 'INTERNAL',
      storageKey: 'media/2026/08/test.webp',
      externalUrl: null,
      originalFileName: 'test.webp',
      mimeType: 'image/webp',
      sizeBytes: 1234n,
      width: null,
      height: null,
      altText: 'Neue Beschreibung',
      copyright: 'Kurvenfunk',
      source: 'Redaktion',
      sourceUrl: 'https://kurvenfunk.at',
      status: 'ACTIVE',
      createdAt: new Date('2026-08-24T12:00:00.000Z'),
      updatedAt: new Date('2026-08-24T13:00:00.000Z'),
    });

    const service = new MediaService(storage);

    const result = await service.update('b102a9df-1929-4600-b068-c415abb5c937', {
      altText: 'Neue Beschreibung',
      copyright: 'Kurvenfunk',
      source: 'Redaktion',
      sourceUrl: 'https://kurvenfunk.at',
    });

    expect(mediaUpdate).toHaveBeenCalledWith({
      where: {
        id: 'b102a9df-1929-4600-b068-c415abb5c937',
      },
      data: {
        altText: 'Neue Beschreibung',
        copyright: 'Kurvenfunk',
        source: 'Redaktion',
        sourceUrl: 'https://kurvenfunk.at',
      },
    });

    expect(result).toMatchObject({
      id: 'b102a9df-1929-4600-b068-c415abb5c937',
      altText: 'Neue Beschreibung',
      copyright: 'Kurvenfunk',
      source: 'Redaktion',
    });
  });

  it('rejects updating missing media', async () => {
    mediaFindFirst.mockResolvedValue(null);

    const service = new MediaService(storage);

    await expect(
      service.update('b102a9df-1929-4600-b068-c415abb5c937', {
        altText: null,
        copyright: null,
        source: null,
        sourceUrl: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mediaUpdate).not.toHaveBeenCalled();
  });
});
