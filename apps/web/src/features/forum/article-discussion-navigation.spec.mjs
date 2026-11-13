import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const article = source('../articles/article-detail.tsx');
const shared = source('../articles/article-discussion.tsx');
const news = source('../articles/news-overview.tsx');
const overview = source('./forum-overview.tsx');
const directory = source('./article-discussion-directory.tsx');
const listingPage = source('../../app/forum/artikel/page.tsx');
const detailPage = source('../../app/forum/artikel/[slug]/page.tsx');
const css = source('./article-discussion-directory.module.css');

describe('22.223 article/forum single-discussion integration', () => {
  it('exposes article discussions from both forum overview and news/article views', () => {
    assert.match(overview, /href="\/forum\/artikel"/);
    assert.match(news, /\/forum\/artikel\//);
    assert.match(article, /<ArticleDiscussion/);
    assert.match(listingPage, /ArticleDiscussionDirectory/);
    assert.match(directory, /\/forum\/artikel\//);
    assert.match(directory, /fetchArticleDiscussionPage/);
  });

  it('reuses one CommentComposer and Article ID in both routes – no mirrored forum thread', () => {
    assert.match(shared, /<CommentComposer/);
    assert.match(shared, /articleId=\{articleId\}/);
    assert.match(shared, /initialCommentCount=\{initialCommentCount\}/);
    assert.match(article, /articleId=\{article.id\}/);
    assert.match(detailPage, /articleId=\{article.id\}/);
    assert.match(detailPage, /<ArticleDiscussion/);
    assert.doesNotMatch(
      detailPage + listingPage + directory,
      /createThread|createPost|\/threads\//,
    );
  });

  it('fails closed on hidden/unpublished article and does not leak SEO duplicates', () => {
    assert.match(detailPage, /articles\/by-slug\//);
    assert.match(detailPage, /response.status === 404/);
    assert.match(detailPage, /notFound\(\)/);
    assert.match(detailPage, /cache: 'no-store'/);
    assert.match(detailPage, /robots: \{ index: false, follow: true \}/);
    assert.match(detailPage, /ARTICLE_DISCUSSION_SLUG_MISMATCH/);
  });

  it('supports mobile, safe empty/error states, and bounded cursor navigation', () => {
    assert.match(css, /@media \(max-width: 640px\)/);
    assert.match(directory, /Aktuell sind keine veröffentlichten Artikel vorhanden/);
    assert.match(directory, /Artikel-Diskussionen sind derzeit nicht erreichbar/);
    assert.match(directory, /Weitere Artikel laden/);
    assert.match(directory, /role="alert"/);
    assert.match(directory, /controller.abort\(\)/);
  });
});
