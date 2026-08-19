'use client';

import { useEffect, useState } from 'react';
import { Button, EmptyState, Field, Input, Skeleton } from '@kurvenfunk/ui';

import { useAuth } from '../../auth/auth-provider';
import styles from './tag-admin.module.css';

interface TagAdminProps {
  apiUrl: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    articles: number;
  };
}

interface TagDraft {
  name: string;
  slug: string;
}

function createSlug(value: string) {
  return value
    .toLocaleLowerCase('de-AT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function TagAdmin({ apiUrl }: TagAdminProps) {
  const { authenticated, initialized, token } = useAuth();

  const [tags, setTags] = useState<Tag[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TagDraft>>({});
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSlugTouched, setNewSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function refreshTags() {
    const response = await fetch(`${apiUrl}/api/v1/tags`);

    const payload = (await response.json().catch(() => null)) as {
      data?: Tag[];
      error?: {
        message?: string;
      };
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Tags konnten nicht geladen werden.');
    }

    const nextTags = payload?.data ?? [];

    setTags(nextTags);
    setDrafts(
      Object.fromEntries(
        nextTags.map((tag) => [
          tag.id,
          {
            name: tag.name,
            slug: tag.slug,
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadTags() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/tags`);

        const payload = (await response.json().catch(() => null)) as {
          data?: Tag[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'Tags konnten nicht geladen werden.');
        }

        if (cancelled) {
          return;
        }

        const nextTags = payload?.data ?? [];

        setTags(nextTags);
        setDrafts(
          Object.fromEntries(
            nextTags.map((tag) => [
              tag.id,
              {
                name: tag.name,
                slug: tag.slug,
              },
            ]),
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Tags konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTags();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  function updateNewName(value: string) {
    setNewName(value);

    if (!newSlugTouched) {
      setNewSlug(createSlug(value));
    }
  }

  function updateDraft(id: string, field: keyof TagDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { name: '', slug: '' }),
        [field]: value,
      },
    }));
  }

  async function createTag() {
    if (!token || creating) {
      return;
    }

    const name = newName.trim();
    const slug = newSlug.trim();

    if (!name || !slug) {
      setError('Bitte Name und Slug eingeben.');
      return;
    }

    setCreating(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tags`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'TAG_SLUG_TAKEN') {
          throw new Error('Dieser Slug wird bereits von einem anderen Tag verwendet.');
        }

        throw new Error(payload?.error?.message ?? 'Tag konnte nicht erstellt werden.');
      }

      setNewName('');
      setNewSlug('');
      setNewSlugTouched(false);
      setMessage('Tag wurde erstellt.');
      await refreshTags();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : 'Tag konnte nicht erstellt werden.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateTag(tag: Tag) {
    if (!token || workingId) {
      return;
    }

    const draft = drafts[tag.id];
    const name = draft?.name.trim();
    const slug = draft?.slug.trim();

    if (!name || !slug) {
      setError('Name und Slug dürfen nicht leer sein.');
      return;
    }

    setWorkingId(tag.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tags/${encodeURIComponent(tag.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'TAG_SLUG_TAKEN') {
          throw new Error('Dieser Slug wird bereits von einem anderen Tag verwendet.');
        }

        throw new Error(payload?.error?.message ?? 'Tag konnte nicht gespeichert werden.');
      }

      setMessage(`„${name}“ wurde gespeichert.`);
      await refreshTags();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : 'Tag konnte nicht gespeichert werden.',
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  async function toggleActive(tag: Tag) {
    if (!token || workingId) {
      return;
    }

    setWorkingId(tag.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tags/${encodeURIComponent(tag.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !tag.active,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Status konnte nicht geändert werden.');
      }

      setMessage(
        tag.active ? `„${tag.name}“ wurde deaktiviert.` : `„${tag.name}“ wurde aktiviert.`,
      );
      await refreshTags();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : 'Status konnte nicht geändert werden.',
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  async function deleteTag(tag: Tag) {
    if (!token || workingId) {
      return;
    }

    if (tag._count.articles > 0) {
      setError('Verwendete Tags können nicht gelöscht werden. Deaktiviere sie stattdessen.');
      return;
    }

    const confirmed = window.confirm(`Tag „${tag.name}“ wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    setWorkingId(tag.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tags/${encodeURIComponent(tag.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'TAG_IN_USE') {
          throw new Error('Der Tag wird bereits verwendet und kann nur deaktiviert werden.');
        }

        throw new Error(payload?.error?.message ?? 'Tag konnte nicht gelöscht werden.');
      }

      setMessage(`„${tag.name}“ wurde gelöscht.`);
      await refreshTags();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Tag konnte nicht gelöscht werden.',
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <Skeleton style={{ height: '140px' }} />
        <Skeleton style={{ height: '180px' }} />
        <Skeleton style={{ height: '180px' }} />
      </div>
    );
  }

  if (!authenticated || !token) {
    return <div className={styles.state}>Du musst angemeldet sein, um Tags zu verwalten.</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Redaktion</p>
          <h1>Tags</h1>
          <p className={styles.intro}>
            Tags erstellen, bearbeiten und für die Redaktion bereitstellen.
          </p>
        </div>
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

      <section className={styles.createCard}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Neuer Tag</h2>
            <p>Der Slug wird automatisch vorgeschlagen und kann angepasst werden.</p>
          </div>
        </div>

        <div className={styles.createForm}>
          <Field label="Name">
            <Input
              value={newName}
              maxLength={100}
              disabled={creating}
              onChange={(event) => updateNewName(event.target.value)}
              placeholder="z. B. Transfers"
            />
          </Field>

          <Field label="Slug">
            <Input
              value={newSlug}
              maxLength={120}
              disabled={creating}
              onChange={(event) => {
                setNewSlugTouched(true);
                setNewSlug(event.target.value);
              }}
              placeholder="transfers"
            />
          </Field>

          <div className={styles.createAction}>
            <Button disabled={creating} onClick={() => void createTag()}>
              {creating ? 'Erstellt …' : 'Tag erstellen'}
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={styles.loading}>
          <Skeleton style={{ height: '180px' }} />
          <Skeleton style={{ height: '180px' }} />
        </div>
      ) : tags.length === 0 ? (
        <EmptyState title="Noch keine Tags">Erstelle den ersten Tag für deine Artikel.</EmptyState>
      ) : (
        <div className={styles.list}>
          {tags.map((tag) => {
            const draft = drafts[tag.id] ?? {
              name: tag.name,
              slug: tag.slug,
            };
            const working = workingId === tag.id;
            const dirty = draft.name !== tag.name || draft.slug !== tag.slug;

            return (
              <section key={tag.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.meta}>
                      <span className={tag.active ? styles.active : styles.inactive}>
                        {tag.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                      <span>
                        {tag._count.articles} {tag._count.articles === 1 ? 'Artikel' : 'Artikel'}
                      </span>
                    </div>

                    <h2>{tag.name}</h2>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="secondary"
                      disabled={Boolean(workingId)}
                      onClick={() => void toggleActive(tag)}
                    >
                      {tag.active ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>

                    <Button
                      variant="danger"
                      disabled={Boolean(workingId) || tag._count.articles > 0}
                      onClick={() => void deleteTag(tag)}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>

                <div className={styles.editForm}>
                  <Field label="Name">
                    <Input
                      value={draft.name}
                      maxLength={100}
                      disabled={working}
                      onChange={(event) => updateDraft(tag.id, 'name', event.target.value)}
                    />
                  </Field>

                  <Field label="Slug">
                    <Input
                      value={draft.slug}
                      maxLength={120}
                      disabled={working}
                      onChange={(event) => updateDraft(tag.id, 'slug', event.target.value)}
                    />
                  </Field>

                  <div className={styles.saveAction}>
                    <Button
                      disabled={Boolean(workingId) || !dirty}
                      onClick={() => void updateTag(tag)}
                    >
                      {working ? 'Speichert …' : 'Speichern'}
                    </Button>
                  </div>
                </div>

                {tag._count.articles > 0 ? (
                  <p className={styles.hint}>
                    Dieser Tag wird verwendet und kann deshalb nicht gelöscht, aber deaktiviert
                    werden.
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
