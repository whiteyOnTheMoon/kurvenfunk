import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from './article-detail.module.css';

interface ArticleContentMark {
  type?: string;
  attrs?: {
    href?: string;
    target?: string | null;
    rel?: string | null;
  };
}

interface ArticleContentNode {
  type?: string;
  text?: string;
  attrs?: {
    level?: number;
    src?: string;
    alt?: string | null;
    title?: string | null;
    start?: number;
    language?: string | null;
  };
  marks?: ArticleContentMark[];
  content?: ArticleContentNode[];
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

function isSafeHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function renderTextNode(node: ArticleContentNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? '';

  for (const [markIndex, mark] of (node.marks ?? []).entries()) {
    const markKey = `${key}-mark-${markIndex}`;

    if (mark.type === 'bold') {
      content = <strong key={markKey}>{content}</strong>;
      continue;
    }

    if (mark.type === 'italic') {
      content = <em key={markKey}>{content}</em>;
      continue;
    }

    if (mark.type === 'strike') {
      content = <s key={markKey}>{content}</s>;
      continue;
    }

    if (mark.type === 'code') {
      content = <code key={markKey}>{content}</code>;
      continue;
    }

    if (mark.type === 'link') {
      const href = mark.attrs?.href;

      if (href && isSafeHttpUrl(href)) {
        content = (
          <a
            key={markKey}
            href={href}
            target={mark.attrs?.target === '_self' ? '_self' : '_blank'}
            rel="noreferrer noopener"
          >
            {content}
          </a>
        );
      }
    }
  }

  return content;
}

function renderChildren(node: ArticleContentNode, key: string): ReactNode[] {
  return (node.content ?? []).map((child, index) => renderContentNode(child, `${key}-${index}`));
}

function renderContentNode(node: ArticleContentNode, key: string): ReactNode {
  if (node.type === 'text') {
    return renderTextNode(node, key);
  }

  if (node.type === 'paragraph') {
    return <p key={key}>{renderChildren(node, key)}</p>;
  }

  if (node.type === 'heading') {
    const children = renderChildren(node, key);

    if (node.attrs?.level === 3) {
      return <h3 key={key}>{children}</h3>;
    }

    if (node.attrs?.level === 4) {
      return <h4 key={key}>{children}</h4>;
    }

    return <h2 key={key}>{children}</h2>;
  }

  if (node.type === 'bulletList') {
    return <ul key={key}>{renderChildren(node, key)}</ul>;
  }

  if (node.type === 'orderedList') {
    return (
      <ol key={key} start={node.attrs?.start}>
        {renderChildren(node, key)}
      </ol>
    );
  }

  if (node.type === 'listItem') {
    return <li key={key}>{renderChildren(node, key)}</li>;
  }

  if (node.type === 'blockquote') {
    return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
  }

  if (node.type === 'codeBlock') {
    const code = (node.content ?? []).map((child) => child.text ?? '').join('');

    return (
      <pre key={key}>
        <code>{code}</code>
      </pre>
    );
  }

  if (node.type === 'horizontalRule') {
    return <hr key={key} />;
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />;
  }

  if (node.type === 'image') {
    const src = node.attrs?.src;

    if (!src || !isSafeHttpUrl(src)) {
      return null;
    }

    return (
      <figure key={key}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={node.attrs?.alt ?? ''} title={node.attrs?.title ?? undefined} />
      </figure>
    );
  }

  return null;
}

function ArticleBody({ content }: { content: ArticleContentNode | null }) {
  if (!content?.content?.length) {
    return <p>Für diesen Artikel ist noch kein Inhalt verfügbar.</p>;
  }

  return (
    <>{content.content.map((node, index) => renderContentNode(node, `article-content-${index}`))}</>
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
