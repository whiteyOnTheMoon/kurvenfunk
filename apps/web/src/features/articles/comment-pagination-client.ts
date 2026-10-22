import type { CommentSortMode } from './comment-sort';

export interface CommentPage<T> {
  items: T[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

export async function fetchCommentPage<T>(
  apiUrl: string,
  articleId: string,
  sort: CommentSortMode,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CommentPage<T>> {
  const params = new URLSearchParams({
    sort,
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(
    `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments?${params.toString()}`,
    {
      cache: 'no-store',
      signal,
    },
  );

  if (!response.ok) {
    throw new Error('COMMENT_PAGE_FAILED');
  }

  const payload = (await response.json()) as {
    data?: CommentPage<T>;
  };

  const page = payload.data;

  if (
    !page ||
    !Array.isArray(page.items) ||
    !page.pagination ||
    typeof page.pagination.hasNextPage !== 'boolean' ||
    !(page.pagination.nextCursor === null || typeof page.pagination.nextCursor === 'string') ||
    (page.pagination.hasNextPage && !page.pagination.nextCursor)
  ) {
    throw new Error('INVALID_COMMENT_PAGE');
  }

  return page;
}

export function mergeCommentPages<T extends { id: string }>(
  current: readonly T[],
  incoming: readonly T[],
): T[] {
  const knownIds = new Set(current.map((comment) => comment.id));

  const merged = [...current];

  for (const comment of incoming) {
    if (knownIds.has(comment.id)) {
      continue;
    }

    knownIds.add(comment.id);
    merged.push(comment);
  }

  return merged;
}
