export interface StoragePutInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StoragePutResult {
  key: string;
}

export interface StorageGetResult {
  body: Buffer;
  contentType?: string;
}

export interface StorageService {
  put(input: StoragePutInput): Promise<StoragePutResult>;
  get(key: string): Promise<StorageGetResult>;
  delete(key: string): Promise<void>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
