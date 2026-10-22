'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { Button, EmptyState, Field, Input, Skeleton } from '@kurvenfunk/ui';

import { useAuth } from '../../auth/auth-provider';
import styles from './media-library.module.css';

interface MediaLibraryProps {
  apiUrl: string;
}

interface MediaUsageCount {
  profileAvatars: number;
  clubLogos: number;
  articleLeads: number;
  total: number;
}

interface MediaItem {
  id: string;
  storageType: string;
  storageKey: string | null;
  externalUrl: string | null;
  originalFileName: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  copyright: string | null;
  source: string | null;
  sourceUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contentUrl: string;
  usage: MediaUsageCount;
}

interface MediaDetail extends Omit<MediaItem, 'usage'> {
  usage: {
    profileAvatars: Array<{
      id: string;
      userId: string;
    }>;
    clubLogos: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    articleLeads: Array<{
      id: string;
      title: string;
      slug: string;
    }>;
    total: number;
  };
}

interface MediaDraft {
  altText: string;
  copyright: string;
  source: string;
  sourceUrl: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function createDraft(media: MediaDetail): MediaDraft {
  return {
    altText: media.altText ?? '',
    copyright: media.copyright ?? '',
    source: media.source ?? '',
    sourceUrl: media.sourceUrl ?? '',
  };
}

export function MediaLibrary({ apiUrl }: MediaLibraryProps) {
  const { authenticated, initialized, token } = useAuth();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaDetail>();
  const [draft, setDraft] = useState<MediaDraft>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function requestMediaList(cursor?: string) {
    if (!token) {
      throw new Error('Keine gültige Anmeldung vorhanden.');
    }

    const params = new URLSearchParams({
      limit: '30',
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${apiUrl}/api/v1/media?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json().catch(() => null)) as {
      data?: {
        items?: MediaItem[];
        nextCursor?: string | null;
      };
      error?: {
        message?: string;
      };
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Medien konnten nicht geladen werden.');
    }

    return {
      items: payload?.data?.items ?? [],
      nextCursor: payload?.data?.nextCursor ?? null,
    };
  }

  async function loadDetail(id: string) {
    if (!token) {
      return;
    }

    setLoadingDetail(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/media/${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: MediaDetail;
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Medium konnte nicht geladen werden.');
      }

      setSelected(payload.data);
      setDraft(createDraft(payload.data));
    } catch (detailError) {
      setError(
        detailError instanceof Error ? detailError.message : 'Medium konnte nicht geladen werden.',
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);
      setError(undefined);

      try {
        const result = await requestMediaList();

        if (!cancelled) {
          setMedia(result.items);
          setNextCursor(result.nextCursor);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Medien konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      cancelled = true;
    };
    // requestMediaList is also reused by pagination and upload refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, authenticated, initialized, token]);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(undefined);

    try {
      const result = await requestMediaList(nextCursor);

      setMedia((current) => [...current, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Weitere Medien konnten nicht geladen werden.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !token || uploading) {
      return;
    }

    setUploading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/api/v1/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: MediaItem;
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Bild konnte nicht hochgeladen werden.');
      }

      const result = await requestMediaList();

      setMedia(result.items);
      setNextCursor(result.nextCursor);
      setMessage(`„${file.name}“ wurde hochgeladen.`);
      await loadDetail(payload.data.id);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Bild konnte nicht hochgeladen werden.',
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function updateDraft(field: keyof MediaDraft, value: string) {
    setDraft((current) => ({
      ...(current ?? {
        altText: '',
        copyright: '',
        source: '',
        sourceUrl: '',
      }),
      [field]: value,
    }));
  }

  async function saveMetadata() {
    if (!selected || !draft || !token || saving) {
      return;
    }

    setSaving(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/media/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: MediaItem;
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Metadaten konnten nicht gespeichert werden.');
      }

      setMedia((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                ...payload.data,
                usage: item.usage,
              }
            : item,
        ),
      );

      setMessage('Medieninformationen wurden gespeichert.');
      await loadDetail(selected.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Metadaten konnten nicht gespeichert werden.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <Skeleton style={{ height: '150px' }} />
        <Skeleton style={{ height: '420px' }} />
      </div>
    );
  }

  if (!authenticated || !token) {
    return <div className={styles.state}>Du musst angemeldet sein, um Medien zu verwalten.</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Redaktion</p>
          <h1>Medien</h1>
          <p className={styles.intro}>
            Bilder hochladen, Metadaten pflegen und ihre Verwendung im Portal kontrollieren.
          </p>
        </div>

        <label className={styles.uploadButton}>
          <span>{uploading ? 'Wird hochgeladen …' : 'Bild hochladen'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => void uploadFile(event)}
          />
        </label>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className={styles.message} role="status">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loading}>
          <Skeleton style={{ height: '220px' }} />
          <Skeleton style={{ height: '220px' }} />
          <Skeleton style={{ height: '220px' }} />
        </div>
      ) : media.length === 0 ? (
        <EmptyState title="Noch keine Medien">
          Lade das erste Bild hoch, um die Medienbibliothek zu befüllen.
        </EmptyState>
      ) : (
        <div className={styles.workspace}>
          <section className={styles.library} aria-label="Medienbibliothek">
            <div className={styles.libraryHeader}>
              <div>
                <h2>Bibliothek</h2>
                <p>{media.length} geladene Medien</p>
              </div>
            </div>

            <div className={styles.grid}>
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.mediaCard} ${
                    selected?.id === item.id ? styles.mediaCardSelected : ''
                  }`}
                  onClick={() => void loadDetail(item.id)}
                >
                  <span className={styles.preview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${apiUrl}${item.contentUrl}`}
                      alt={item.altText ?? ''}
                      loading="lazy"
                    />
                  </span>

                  <span className={styles.mediaCardBody}>
                    <strong>{item.originalFileName ?? 'Unbenanntes Bild'}</strong>
                    <span>
                      {formatBytes(item.sizeBytes)} · {item.mimeType}
                    </span>
                    <span>
                      {item.usage.total === 0
                        ? 'Nicht verwendet'
                        : `${item.usage.total}× verwendet`}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {nextCursor ? (
              <div className={styles.loadMore}>
                <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? 'Lädt …' : 'Weitere laden'}
                </Button>
              </div>
            ) : null}
          </section>

          <aside className={styles.detail}>
            {loadingDetail ? (
              <div className={styles.detailLoading}>
                <Skeleton style={{ height: '240px' }} />
                <Skeleton style={{ height: '320px' }} />
              </div>
            ) : selected && draft ? (
              <>
                <div className={styles.detailPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${apiUrl}${selected.contentUrl}`} alt={selected.altText ?? ''} />
                </div>

                <div className={styles.detailHeading}>
                  <div>
                    <p className={styles.detailLabel}>Ausgewähltes Medium</p>
                    <h2>{selected.originalFileName ?? 'Unbenanntes Bild'}</h2>
                  </div>

                  <dl className={styles.fileMeta}>
                    <div>
                      <dt>Typ</dt>
                      <dd>{selected.mimeType}</dd>
                    </div>
                    <div>
                      <dt>Größe</dt>
                      <dd>{formatBytes(selected.sizeBytes)}</dd>
                    </div>
                    <div>
                      <dt>Upload</dt>
                      <dd>{formatDate(selected.createdAt)} Uhr</dd>
                    </div>
                    {selected.width && selected.height ? (
                      <div>
                        <dt>Abmessungen</dt>
                        <dd>
                          {selected.width} × {selected.height}px
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className={styles.form}>
                  <Field label="Alt-Text">
                    <Input
                      id="media-alt-text"
                      value={draft.altText}
                      maxLength={500}
                      onChange={(event) => updateDraft('altText', event.target.value)}
                    />
                  </Field>

                  <Field label="Copyright">
                    <Input
                      id="media-copyright"
                      value={draft.copyright}
                      maxLength={500}
                      onChange={(event) => updateDraft('copyright', event.target.value)}
                    />
                  </Field>

                  <Field label="Quelle">
                    <Input
                      id="media-source"
                      value={draft.source}
                      maxLength={500}
                      onChange={(event) => updateDraft('source', event.target.value)}
                    />
                  </Field>

                  <Field label="Quell-URL">
                    <Input
                      id="media-source-url"
                      type="url"
                      value={draft.sourceUrl}
                      placeholder="https://…"
                      onChange={(event) => updateDraft('sourceUrl', event.target.value)}
                    />
                  </Field>

                  <Button disabled={saving} onClick={() => void saveMetadata()}>
                    {saving ? 'Speichert …' : 'Metadaten speichern'}
                  </Button>
                </div>

                <section className={styles.usage}>
                  <div className={styles.usageHeading}>
                    <h3>Verwendung</h3>
                    <span>{selected.usage.total}</span>
                  </div>

                  {selected.usage.total === 0 ? (
                    <p className={styles.usageEmpty}>
                      Dieses Bild wird derzeit nirgends verwendet.
                    </p>
                  ) : (
                    <div className={styles.usageGroups}>
                      {selected.usage.articleLeads.length > 0 ? (
                        <div>
                          <strong>Artikel</strong>
                          <ul>
                            {selected.usage.articleLeads.map((article) => (
                              <li key={article.id}>
                                {article.title}
                                <span>/{article.slug}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {selected.usage.clubLogos.length > 0 ? (
                        <div>
                          <strong>Vereinslogos</strong>
                          <ul>
                            {selected.usage.clubLogos.map((club) => (
                              <li key={club.id}>
                                {club.name}
                                <span>/{club.slug}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {selected.usage.profileAvatars.length > 0 ? (
                        <div>
                          <strong>Profilbilder</strong>
                          <p>{selected.usage.profileAvatars.length} Profil(e)</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className={styles.detailEmpty}>
                <strong>Kein Medium ausgewählt</strong>
                <p>Wähle ein Bild aus der Bibliothek, um Details und Verwendung zu sehen.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
