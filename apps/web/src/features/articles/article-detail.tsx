import Link from 'next/link';

import styles from './article-detail.module.css';

interface ArticleContentText {
  type?: string;
  text?: string;
}

interface ArticleContentNode {
  type?: string;
  content?: Array<ArticleContentNode | ArticleContentText>;
}

export interface ArticleDetailData {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  content: ArticleContentNode | null;
  publishedAt: string;
  originalUrl: string | null;
  author: {
    id: string;
    nickname: string | null;
  } | null;
  source: {
    id: string;
    name: string;
    website: string | null;
  } | null;
  leadMedia: {
    id: string;
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
    copyright: string | null;
    source: string | null;
    sourceUrl: string | null;
    width: number | null;
    height: number | null;
  } | null;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  clubs: Array<{
    club: {
      id: string;
      name: string;
      shortName: string | null;
      slug: string;
    };
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function renderText(node: ArticleContentNode | ArticleContentText): string {
  if ('text' in node && typeof node.text === 'string') {
    return node.text;
  }

  if (!('content' in node) || !node.content) {
    return '';
  }

  return node.content.map(renderText).join('');
}

function ArticleBody({ content }: { content: ArticleContentNode | null }) {
  if (!content?.content?.length) {
    return <p>Für diesen Artikel ist noch kein Inhalt verfügbar.</p>;
  }

  return (
    <>
      {content.content.map((node, index) => {
        const text = renderText(node);

        if (!text) {
          return null;
        }

        if (node.type === 'heading') {
          return <h2 key={index}>{text}</h2>;
        }

        return <p key={index}>{text}</p>;
      })}
    </>
  );
}

export function ArticleDetail({ article }: { article: ArticleDetailData }) {
  const category =
    article.competition?.shortName ??
    article.competition?.name ??
    article.clubs[0]?.club.shortName ??
    article.clubs[0]?.club.name ??
    'Fußball';

  return (
    <article className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/news">News</Link>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
      </div>

      <header className={styles.header}>
        <span className={styles.eyebrow}>{category}</span>

        <h1>{article.title}</h1>

        {article.lead ? <p className={styles.lead}>{article.lead}</p> : null}

        <div className={styles.meta}>
          <span>
            Von <strong>{article.author?.nickname ?? article.source?.name ?? 'Kurvenfunk'}</strong>
          </span>
          <span>{formatPublishedAt(article.publishedAt)} Uhr</span>
        </div>
      </header>

      {article.leadMedia?.externalUrl ? (
        <figure className={styles.leadFigure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.leadMedia.externalUrl}
            alt={article.leadMedia.altText ?? ''}
            width={article.leadMedia.width ?? undefined}
            height={article.leadMedia.height ?? undefined}
          />

          {article.leadMedia.copyright || article.leadMedia.source ? (
            <figcaption>
              {[article.leadMedia.copyright, article.leadMedia.source].filter(Boolean).join(' · ')}
            </figcaption>
          ) : null}
        </figure>
      ) : (
        <div className={styles.mediaFallback} aria-hidden="true">
          <span>KF</span>
          <strong>{category}</strong>
        </div>
      )}

      <div className={styles.layout}>
        <div>
          <div className={styles.articleBody}>
            <ArticleBody content={article.content} />
          </div>

          {article.originalUrl || article.source ? (
            <aside className={styles.sourceBox}>
              <span>Quelle</span>
              <strong>{article.source?.name ?? 'Externe Quelle'}</strong>

              {article.originalUrl ? (
                <a href={article.originalUrl} target="_blank" rel="noreferrer">
                  Originalartikel öffnen ↗
                </a>
              ) : null}
            </aside>
          ) : null}

          {article.tags.length > 0 ? (
            <div className={styles.tags} aria-label="Tags">
              {article.tags.map(({ tag }) => (
                <span key={tag.id}>#{tag.name}</span>
              ))}
            </div>
          ) : null}

          <section className={styles.discussion} id="diskussion">
            <div>
              <span className={styles.eyebrow}>Community</span>
              <h2>Diskussion</h2>
              <p>
                {article._count.comments === 0
                  ? 'Zu diesem Artikel gibt es noch keine Beiträge.'
                  : `${article._count.comments} Beiträge zu diesem Artikel.`}
              </p>
            </div>

            <div className={styles.discussionPlaceholder}>
              Die Artikeldiskussion wird mit dem Community-System freigeschaltet.
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          {article.clubs.length > 0 ? (
            <section className={styles.sidebarCard}>
              <span className={styles.sidebarLabel}>Vereine</span>

              <div className={styles.clubList}>
                {article.clubs.map(({ club }) => (
                  <div key={club.id} className={styles.club}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/clubs/${club.slug}.svg`} alt="" width="36" height="36" />
                    <span>{club.shortName ?? club.name}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {article.competition ? (
            <section className={styles.sidebarCard}>
              <span className={styles.sidebarLabel}>Wettbewerb</span>
              <strong>{article.competition.name}</strong>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
