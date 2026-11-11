'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from './forum-overview.module.css';

interface ForumSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  club: { id: string; name: string; slug: string } | null;
  threadCreationEnabled: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  forums: ForumSummary[];
}

interface ApiResponse<T> {
  data?: T;
}

interface ForumOverviewProps {
  apiUrl: string;
  categorySlug?: string;
}

function isForumSummary(value: unknown): value is ForumSummary {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'slug' in value &&
    typeof value.slug === 'string' &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

function isForumCategory(value: unknown): value is ForumCategory {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'slug' in value &&
    typeof value.slug === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'forums' in value &&
    Array.isArray(value.forums) &&
    value.forums.every(isForumSummary)
  );
}

function CategorySection({
  category,
  detail = false,
}: {
  category: ForumCategory;
  detail?: boolean;
}) {
  return (
    <section className={styles.category} aria-label={category.name}>
      <div className={styles.categoryHeader}>
        {detail ? (
          <h2>{category.name}</h2>
        ) : (
          <h2>
            <Link href={`/forum/kategorie/${category.slug}`}>{category.name}</Link>
          </h2>
        )}
        {category.description ? <p>{category.description}</p> : null}
      </div>

      {category.forums.length ? (
        <ul className={styles.forumList}>
          {category.forums.map((forum) => (
            <li key={forum.id} className={styles.forumItem}>
              <strong>{forum.name}</strong>
              {forum.description ? <span>{forum.description}</span> : null}
              {forum.club ? (
                <Link href={`/vereine/${forum.club.slug}`}>Zum Verein: {forum.club.name}</Link>
              ) : null}
              {!forum.threadCreationEnabled ? <small>Aktuell nur lesbar</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>In dieser Kategorie sind noch keine Foren eingerichtet.</p>
      )}
    </section>
  );
}

export function ForumOverview({ apiUrl, categorySlug }: ForumOverviewProps) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const endpoint = categorySlug
          ? `/api/v1/forums/categories/${encodeURIComponent(categorySlug)}`
          : '/api/v1/forums/categories';
        const response = await fetch(`${apiUrl}${endpoint}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('FORUM_CATEGORY_REQUEST_FAILED');
        const result = (await response.json()) as ApiResponse<ForumCategory[] | ForumCategory>;
        const items = categorySlug ? [result.data] : result.data;
        if (!Array.isArray(items) || !items.every(isForumCategory)) {
          throw new Error('FORUM_CATEGORY_RESPONSE_INVALID');
        }
        if (!controller.signal.aborted) setCategories(items);
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
          setCategories([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [apiUrl, categorySlug]);

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        {categorySlug ? (
          <Link href="/forum" className={styles.backLink}>
            Alle Forenkategorien
          </Link>
        ) : null}
        <p className={styles.eyebrow}>Community</p>
        <h1>{categorySlug && categories[0] ? categories[0].name : 'Forum'}</h1>
        <p>Diskussionen rund um österreichischen Fußball – mit klaren Regeln und Moderation.</p>
      </header>

      {loading ? (
        <p className={styles.status} role="status">
          Foren werden geladen …
        </p>
      ) : error ? (
        <p className={styles.status} role="alert">
          Die Forenübersicht ist derzeit nicht erreichbar. Bitte versuche es später erneut.
        </p>
      ) : categories.length === 0 ? (
        <p className={styles.status}>
          {categorySlug
            ? 'Diese Forenkategorie ist nicht verfügbar.'
            : 'Das Forum wird eingerichtet. Noch keine freigegebenen Forenkategorien vorhanden.'}
        </p>
      ) : (
        <div className={styles.categories}>
          {categories.map((category) => (
            <CategorySection key={category.id} category={category} detail={Boolean(categorySlug)} />
          ))}
        </div>
      )}
    </div>
  );
}
