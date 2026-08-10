export interface RequestContext {
  requestId: string;
}

export interface ContextualPayload<T> {
  context: RequestContext;
  data: T;
}
