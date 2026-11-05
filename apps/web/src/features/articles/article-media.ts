/**
 * Public article media can either be an uploaded image in our object storage
 * or an externally hosted image. Object storage keys are private details and
 * must never be exposed as image URLs.
 */
export function getArticleLeadMediaSrc(
  apiUrl: string,
  media: { id: string; storageKey: string | null; externalUrl: string | null } | null,
): string | null {
  if (!media) {
    return null;
  }

  if (media.storageKey) {
    return `${apiUrl.replace(/\/$/, '')}/api/v1/media/${encodeURIComponent(media.id)}/content`;
  }

  if (media.externalUrl && /^https?:\/\//i.test(media.externalUrl)) {
    return media.externalUrl;
  }

  return null;
}
