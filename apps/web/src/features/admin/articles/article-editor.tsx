'use client';

import { useEffect, useState } from 'react';
import { Button, Field, Input, Textarea } from '@kurvenfunk/ui';
import type { JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { useAuth } from '../../auth/auth-provider';
import styles from './article-editor.module.css';

interface ArticleEditorProps {
  apiUrl: string;
  articleId?: string;
}

interface EditorialArticle {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  content: JSONContent;
  status: string;
}

const EMPTY_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

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

export function ArticleEditor({ apiUrl, articleId }: ArticleEditorProps) {
  const { authenticated, initialized, token } = useAuth();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [lead, setLead] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [savedArticle, setSavedArticle] = useState<EditorialArticle>();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        allowBase64: false,
      }),
    ],
    content: EMPTY_DOCUMENT,
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
  });

  useEffect(() => {
    if (!articleId || !initialized || !authenticated || !token || !editor) {
      return;
    }

    const currentArticleId = articleId;
    const currentEditor = editor;
    let cancelled = false;

    async function loadArticle() {
      setLoadingArticle(true);
      setError(undefined);

      try {
        const response = await fetch(
          `${apiUrl}/api/v1/articles/editorial/${encodeURIComponent(currentArticleId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialArticle;
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Artikel konnte nicht geladen werden.');
        }

        if (cancelled) {
          return;
        }

        const article = payload.data;

        setTitle(article.title);
        setSlug(article.slug);
        setSlugTouched(true);
        setLead(article.lead ?? '');
        setSavedArticle(article);
        currentEditor.commands.setContent(article.content);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Artikel konnte nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingArticle(false);
        }
      }
    }

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, articleId, authenticated, editor, initialized, token]);

  function updateTitle(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(createSlug(value));
    }
  }

  function setLink() {
    if (!editor) {
      return;
    }

    const currentHref = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Link-URL', currentHref ?? 'https://');

    if (href === null) {
      return;
    }

    const normalized = href.trim();

    if (!normalized) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    if (!/^https?:\/\//i.test(normalized)) {
      setError('Links müssen mit http:// oder https:// beginnen.');
      return;
    }

    setError(undefined);
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }

  function insertImage() {
    if (!editor) {
      return;
    }

    const src = window.prompt('Bild-URL', 'https://');

    if (!src) {
      return;
    }

    const normalized = src.trim();

    if (!/^https?:\/\//i.test(normalized)) {
      setError('Bild-URLs müssen mit http:// oder https:// beginnen.');
      return;
    }

    const alt = window.prompt('Alternativtext für das Bild', '') ?? '';

    setError(undefined);
    editor.chain().focus().setImage({ src: normalized, alt }).run();
  }

  async function saveArticle() {
    if (!editor || !token || saving) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();
    const trimmedLead = lead.trim();

    if (!trimmedTitle) {
      setError('Bitte einen Titel eingeben.');
      return;
    }

    if (!trimmedSlug) {
      setError('Bitte einen Slug eingeben.');
      return;
    }

    setSaving(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        articleId
          ? `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}`
          : `${apiUrl}/api/v1/articles`,
        {
          method: articleId ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: trimmedTitle,
            slug: trimmedSlug,
            lead: trimmedLead || null,
            content: editor.getJSON(),
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        data?: EditorialArticle;
        error?: {
          code?: string;
          message?: string;
        };
      } | null;

      if (!response.ok) {
        if (payload?.error?.code === 'ARTICLE_SLUG_TAKEN') {
          throw new Error('Dieser Slug wird bereits von einem anderen Artikel verwendet.');
        }

        throw new Error(payload?.error?.message ?? 'Artikel konnte nicht gespeichert werden.');
      }

      const article = payload?.data;

      if (!article) {
        throw new Error('Die API hat keinen gespeicherten Artikel zurückgegeben.');
      }

      setSavedArticle(article);
      setMessage(articleId ? 'Änderungen gespeichert.' : 'Entwurf gespeichert.');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Artikel konnte nicht gespeichert werden.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!initialized || loadingArticle) {
    return <div className={styles.state}>Redaktion wird geladen …</div>;
  }

  if (!authenticated || !token) {
    return (
      <div className={styles.state}>Du musst angemeldet sein, um einen Artikel zu erstellen.</div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Redaktion</p>
          <h1>{articleId ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h1>
          <p className={styles.intro}>
            {articleId
              ? 'Bestehenden Artikel bearbeiten und Änderungen speichern.'
              : 'Artikel verfassen und als Entwurf im Redaktionssystem speichern.'}
          </p>
        </div>

        <div className={styles.actions}>
          <span className={styles.status}>{savedArticle ? savedArticle.status : 'DRAFT'}</span>
          <Button disabled={!editor || saving} onClick={() => void saveArticle()}>
            {saving ? 'Speichert …' : articleId ? 'Änderungen speichern' : 'Entwurf speichern'}
          </Button>
        </div>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className={styles.success} role="status">
          {message}
        </div>
      ) : null}

      <div className={styles.workspace}>
        <main className={styles.main}>
          <section className={styles.metadata}>
            <Field label="Titel">
              <Input
                value={title}
                maxLength={300}
                placeholder="Titel des Artikels"
                onChange={(event) => updateTitle(event.target.value)}
              />
            </Field>

            <Field
              label="Slug"
              hint="Wird aus dem Titel vorgeschlagen und kann manuell geändert werden."
            >
              <Input
                value={slug}
                placeholder="titel-des-artikels"
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
              />
            </Field>

            <Field label="Lead" hint="Kurze Einleitung unter der Überschrift.">
              <Textarea
                value={lead}
                maxLength={1000}
                rows={4}
                placeholder="Worum geht es in diesem Artikel?"
                onChange={(event) => setLead(event.target.value)}
              />
            </Field>
          </section>

          <section className={styles.editorSection}>
            <div className={styles.editorLabel}>Inhalt</div>

            <div className={styles.editorShell}>
              <div className={styles.toolbar} role="toolbar" aria-label="Textformatierung">
                <button
                  type="button"
                  className={editor?.isActive('paragraph') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                >
                  Absatz
                </button>

                {[2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      editor?.isActive('heading', { level }) ? styles.activeTool : styles.tool
                    }
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({ level: level as 2 | 3 | 4 })
                        .run()
                    }
                  >
                    H{level}
                  </button>
                ))}

                <span className={styles.separator} />

                <button
                  type="button"
                  className={editor?.isActive('bold') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  Fett
                </button>

                <button
                  type="button"
                  className={editor?.isActive('italic') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  Kursiv
                </button>

                <span className={styles.separator} />

                <button
                  type="button"
                  className={editor?.isActive('bulletList') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  Liste
                </button>

                <button
                  type="button"
                  className={editor?.isActive('orderedList') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  1. Liste
                </button>

                <button
                  type="button"
                  className={editor?.isActive('blockquote') ? styles.activeTool : styles.tool}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                >
                  Zitat
                </button>

                <span className={styles.separator} />

                <button
                  type="button"
                  className={editor?.isActive('link') ? styles.activeTool : styles.tool}
                  onClick={setLink}
                >
                  Link
                </button>

                {editor?.isActive('link') ? (
                  <button
                    type="button"
                    className={styles.tool}
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    Link lösen
                  </button>
                ) : null}

                <button type="button" className={styles.tool} onClick={insertImage}>
                  Bild
                </button>
              </div>

              <EditorContent editor={editor} />
            </div>
          </section>
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Status</span>
            <strong>{savedArticle ? savedArticle.status : 'Entwurf'}</strong>
            <p>
              Task 133 erstellt zunächst Entwürfe. Review, Planung und Veröffentlichung laufen über
              den bereits vorhandenen Publication Workflow.
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Editor</span>
            <p>Unterstützt Text, H2–H4, Links, Listen, Zitate und Bilder per URL.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
