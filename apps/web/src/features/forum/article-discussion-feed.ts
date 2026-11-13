/**
 * Phase 22.223: forum discovery reuses public articles. Articles and their
 * forum entry are one canonical Comment discussion (same article ID).
 * No Forum/Thread/Post mirror records, write API, migration or demo content.
 */
export interface ArticleDiscussionEntry {
  id: string;
  slug: string;
  title: string;
  lead: string | null;
  publishedAt: string;
}

export interface ArticleDiscussionPage {
  items: ArticleDiscussionEntry[];
  pagination: { nextCursor: string | null; hasNextPage: boolean };
}

export interface ArticleDiscussionDetail extends ArticleDiscussionEntry {
  _count: { comments: number };
}

function isEntry(value: unknown): value is ArticleDiscussionEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ArticleDiscussionEntry>;
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.slug === 'string' &&
    entry.slug.length > 0 &&
    typeof entry.title === 'string' &&
    entry.title.trim().length > 0 &&
    (entry.lead === null || typeof entry.lead === 'string') &&
    typeof entry.publishedAt === 'string' &&
    Number.isFinite(Date.parse(entry.publishedAt))
  );
}

export function parseArticleDiscussionPage(payload: unknown): ArticleDiscussionPage {
  if (!payload || typeof payload !== 'object') throw new Error('ARTICLE_DISCUSSIONS_INVALID');
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') throw new Error('ARTICLE_DISCUSSIONS_INVALID');
  const page = data as Partial<ArticleDiscussionPage>;
  const pagination = page.pagination;
  if (
    !Array.isArray(page.items) ||
    !page.items.every(isEntry) ||
    !pagination ||
    typeof pagination.hasNextPage !== 'boolean' ||
    (pagination.hasNextPage
      ? typeof pagination.nextCursor !== 'string' || pagination.nextCursor.length === 0
      : pagination.nextCursor !== null)
  ) {
    throw new Error('ARTICLE_DISCUSSIONS_INVALID');
  }
  return { items: page.items, pagination };
}

export function parseArticleDiscussionDetail(payload: unknown): ArticleDiscussionDetail {
  if (!payload || typeof payload !== 'object') throw new Error('ARTICLE_DISCUSSION_INVALID');
  const data = (payload as { data?: unknown }).data;
  if (!isEntry(data)) throw new Error('ARTICLE_DISCUSSION_INVALID');
  const count = (data as Partial<ArticleDiscussionDetail>)._count?.comments;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
    throw new Error('ARTICLE_DISCUSSION_INVALID');
  }
  return { ...data, _count: { comments: count } };
}

export async function fetchArticleDiscussionPage(
  apiUrl: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<ArticleDiscussionPage> {
  const params = new URLSearchParams({ limit: '12' });
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(apiUrl.replace(/\/$/, '') + '/api/v1/articles?' + params.toString(), {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('ARTICLE_DISCUSSIONS_UNAVAILABLE');
  return parseArticleDiscussionPage(await response.json());
}

export function mergeArticleDiscussionPages(
  current: ArticleDiscussionEntry[],
  more: ArticleDiscussionEntry[],
): ArticleDiscussionEntry[] {
  const seen = new Set(current.map((article) => article.id));
  return [
    ...current,
    ...more.filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    }),
  ];
}
