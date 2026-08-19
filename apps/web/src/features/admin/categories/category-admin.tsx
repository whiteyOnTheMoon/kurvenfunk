'use client';

import { useEffect, useState } from 'react';
import { Button, EmptyState, Field, Input, Skeleton } from '@kurvenfunk/ui';

import { useAuth } from '../../auth/auth-provider';
import styles from './category-admin.module.css';

interface CategoryAdminProps {
  apiUrl: string;
}

interface Category {
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

interface CategoryDraft {
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

export function CategoryAdmin({ apiUrl }: CategoryAdminProps) {
  const { authenticated, initialized, token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSlugTouched, setNewSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function refreshCategories() {
    const response = await fetch(`${apiUrl}/api/v1/categories`);

    const payload = (await response.json().catch(() => null)) as {
      data?: Category[];
      error?: {
        message?: string;
      };
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Kategorien konnten nicht geladen werden.');
    }

    const nextCategories = payload?.data ?? [];

    setCategories(nextCategories);
    setDrafts(
      Object.fromEntries(
        nextCategories.map((category) => [
          category.id,
          {
            name: category.name,
            slug: category.slug,
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

    async function loadCategories() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/categories`);

        const payload = (await response.json().catch(() => null)) as {
          data?: Category[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'Kategorien konnten nicht geladen werden.');
        }

        if (cancelled) {
          return;
        }

        const nextCategories = payload?.data ?? [];

        setCategories(nextCategories);
        setDrafts(
          Object.fromEntries(
            nextCategories.map((category) => [
              category.id,
              {
                name: category.name,
                slug: category.slug,
              },
            ]),
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Kategorien konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

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

  function updateDraft(id: string, field: keyof CategoryDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { name: '', slug: '' }),
        [field]: value,
      },
    }));
  }

  async function createCategory() {
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
      const response = await fetch(`${apiUrl}/api/v1/categories`, {
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
        if (payload?.error?.code === 'CATEGORY_SLUG_TAKEN') {
          throw new Error('Dieser Slug wird bereits von einer anderen Kategorie verwendet.');
        }

        throw new Error(payload?.error?.message ?? 'Kategorie konnte nicht erstellt werden.');
      }

      setNewName('');
      setNewSlug('');
      setNewSlugTouched(false);
      setMessage('Kategorie wurde erstellt.');
      await refreshCategories();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Kategorie konnte nicht erstellt werden.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateCategory(category: Category) {
    if (!token || workingId) {
      return;
    }

    const draft = drafts[category.id];
    const name = draft?.name.trim();
    const slug = draft?.slug.trim();

    if (!name || !slug) {
      setError('Name und Slug dürfen nicht leer sein.');
      return;
    }

    setWorkingId(category.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/categories/${encodeURIComponent(category.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            slug,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'CATEGORY_SLUG_TAKEN') {
          throw new Error('Dieser Slug wird bereits von einer anderen Kategorie verwendet.');
        }

        throw new Error(payload?.error?.message ?? 'Kategorie konnte nicht gespeichert werden.');
      }

      setMessage(`„${name}“ wurde gespeichert.`);
      await refreshCategories();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Kategorie konnte nicht gespeichert werden.',
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  async function toggleActive(category: Category) {
    if (!token || workingId) {
      return;
    }

    setWorkingId(category.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/categories/${encodeURIComponent(category.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            active: !category.active,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Status konnte nicht geändert werden.');
      }

      setMessage(
        category.active
          ? `„${category.name}“ wurde deaktiviert.`
          : `„${category.name}“ wurde aktiviert.`,
      );
      await refreshCategories();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : 'Status konnte nicht geändert werden.',
      );
    } finally {
      setWorkingId(undefined);
    }
  }

  async function deleteCategory(category: Category) {
    if (!token || workingId) {
      return;
    }

    if (category._count.articles > 0) {
      setError('Verwendete Kategorien können nicht gelöscht werden. Deaktiviere sie stattdessen.');
      return;
    }

    const confirmed = window.confirm(`Kategorie „${category.name}“ wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    setWorkingId(category.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/categories/${encodeURIComponent(category.id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'CATEGORY_IN_USE') {
          throw new Error('Die Kategorie wird bereits verwendet und kann nur deaktiviert werden.');
        }

        throw new Error(payload?.error?.message ?? 'Kategorie konnte nicht gelöscht werden.');
      }

      setMessage(`„${category.name}“ wurde gelöscht.`);
      await refreshCategories();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Kategorie konnte nicht gelöscht werden.',
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
    return (
      <div className={styles.state}>Du musst angemeldet sein, um Kategorien zu verwalten.</div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Redaktion</p>
          <h1>Kategorien</h1>
          <p className={styles.intro}>
            Artikelkategorien erstellen, bearbeiten und für die Redaktion bereitstellen.
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
            <h2>Neue Kategorie</h2>
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
            <Button disabled={creating} onClick={() => void createCategory()}>
              {creating ? 'Erstellt …' : 'Kategorie erstellen'}
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={styles.loading}>
          <Skeleton style={{ height: '180px' }} />
          <Skeleton style={{ height: '180px' }} />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="Noch keine Kategorien">
          Erstelle die erste Kategorie für deine Artikel.
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {categories.map((category) => {
            const draft = drafts[category.id] ?? {
              name: category.name,
              slug: category.slug,
            };
            const working = workingId === category.id;
            const dirty = draft.name !== category.name || draft.slug !== category.slug;

            return (
              <section key={category.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.meta}>
                      <span className={category.active ? styles.active : styles.inactive}>
                        {category.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                      <span>
                        {category._count.articles}{' '}
                        {category._count.articles === 1 ? 'Artikel' : 'Artikel'}
                      </span>
                    </div>

                    <h2>{category.name}</h2>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="secondary"
                      disabled={Boolean(workingId)}
                      onClick={() => void toggleActive(category)}
                    >
                      {category.active ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>

                    <Button
                      variant="danger"
                      disabled={Boolean(workingId) || category._count.articles > 0}
                      onClick={() => void deleteCategory(category)}
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
                      onChange={(event) => updateDraft(category.id, 'name', event.target.value)}
                    />
                  </Field>

                  <Field label="Slug">
                    <Input
                      value={draft.slug}
                      maxLength={120}
                      disabled={working}
                      onChange={(event) => updateDraft(category.id, 'slug', event.target.value)}
                    />
                  </Field>

                  <div className={styles.saveAction}>
                    <Button
                      disabled={Boolean(workingId) || !dirty}
                      onClick={() => void updateCategory(category)}
                    >
                      {working ? 'Speichert …' : 'Speichern'}
                    </Button>
                  </div>
                </div>

                {category._count.articles > 0 ? (
                  <p className={styles.hint}>
                    Diese Kategorie wird verwendet und kann deshalb nicht gelöscht, aber deaktiviert
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
