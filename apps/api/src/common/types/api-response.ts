export interface ApiResponseMeta {
  requestId: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiResponseMeta;
}
