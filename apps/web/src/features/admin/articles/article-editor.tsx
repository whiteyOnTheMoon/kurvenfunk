'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Field, Input, Textarea } from '@kurvenfunk/ui';
import type { JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { useAuth } from '../../auth/auth-provider';
import styles from './article-editor.module.css';

interface ArticleEditorProps {
  apiUrl: string;
  articleId?: string;
}

type ArticleStatus = 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

interface EditorialCompetition {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface EditorialClub {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface EditorialMatchClub {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface EditorialMatch {
  id: string;
  kickoff: string;
  matchday: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: EditorialMatchClub;
  awayClub: EditorialMatchClub;
}

interface EditorialMatchSchedule {
  competition: EditorialCompetition;
  matches: EditorialMatch[];
}

interface ArticleClubAssignment {
  clubId: string;
  club: EditorialClub;
}

interface EditorialCategory {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface ArticleCategoryAssignment {
  categoryId: string;
  category: EditorialCategory;
}

interface EditorialTag {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface ArticleTagAssignment {
  tagId: string;
  tag: EditorialTag;
}

interface EditorialMediaItem {
  id: string;
  originalFileName: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  altText: string | null;
}

interface EditorialMediaList {
  items: EditorialMediaItem[];
  nextCursor: string | null;
}

interface EditorialArticle {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageId: string | null;
  ogImage: EditorialMediaItem | null;
  content: JSONContent;
  status: ArticleStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  competitionId?: string | null;
  matchId?: string | null;
  clubs?: ArticleClubAssignment[];
  categories?: ArticleCategoryAssignment[];
  tags?: ArticleTagAssignment[];
  leadMediaId: string | null;
  leadMedia: EditorialMediaItem | null;
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
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [selectedOgImage, setSelectedOgImage] = useState<EditorialMediaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));
  const [scheduledAt, setScheduledAt] = useState('');
  const [competitions, setCompetitions] = useState<EditorialCompetition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [matches, setMatches] = useState<EditorialMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [clubs, setClubs] = useState<EditorialClub[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [categories, setCategories] = useState<EditorialCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tags, setTags] = useState<EditorialTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [savedArticle, setSavedArticle] = useState<EditorialArticle>();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'content' | 'lead' | 'og'>('content');
  const [selectedLeadMedia, setSelectedLeadMedia] = useState<EditorialMediaItem | null>(null);
  const [mediaItems, setMediaItems] = useState<EditorialMediaItem[]>([]);
  const [mediaNextCursor, setMediaNextCursor] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      TiptapLink.configure({
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
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadCompetitions() {
      setLoadingCompetitions(true);

      try {
        const response = await fetch(`${apiUrl}/api/v1/competitions`);
        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialCompetition[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Wettbewerbe konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setCompetitions(payload.data);
        }
      } catch (competitionError) {
        if (!cancelled) {
          setError(
            competitionError instanceof Error
              ? competitionError.message
              : 'Wettbewerbe konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCompetitions(false);
        }
      }
    }

    void loadCompetitions();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    if (!selectedCompetitionId) {
      return;
    }

    const competition = competitions.find((item) => item.id === selectedCompetitionId);

    if (!competition) {
      return;
    }

    const competitionSlug = competition.slug;
    let cancelled = false;

    async function loadMatches() {
      setLoadingMatches(true);

      try {
        const response = await fetch(
          `${apiUrl}/api/v1/matches?competition=${encodeURIComponent(competitionSlug)}`,
        );

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialMatchSchedule;
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Spiele konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setMatches(payload.data.matches);

          setSelectedMatchId((current) =>
            current && payload.data?.matches.some((match) => match.id === current) ? current : '',
          );
        }
      } catch (matchError) {
        if (!cancelled) {
          setMatches([]);
          setError(
            matchError instanceof Error
              ? matchError.message
              : 'Spiele konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMatches(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, competitions, initialized, selectedCompetitionId, token]);

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadClubs() {
      setLoadingClubs(true);

      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs`);

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialClub[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Vereine konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setClubs(payload.data);
        }
      } catch (clubError) {
        if (!cancelled) {
          setError(
            clubError instanceof Error
              ? clubError.message
              : 'Vereine konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingClubs(false);
        }
      }
    }

    void loadClubs();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);

      try {
        const response = await fetch(`${apiUrl}/api/v1/categories`);

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialCategory[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Kategorien konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setCategories(payload.data.filter((category) => category.active));
        }
      } catch (categoryError) {
        if (!cancelled) {
          setError(
            categoryError instanceof Error
              ? categoryError.message
              : 'Kategorien konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadTags() {
      setLoadingTags(true);

      try {
        const response = await fetch(`${apiUrl}/api/v1/tags`);

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialTag[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message ?? 'Tags konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setTags(payload.data.filter((tag) => tag.active));
        }
      } catch (tagError) {
        if (!cancelled) {
          setError(
            tagError instanceof Error ? tagError.message : 'Tags konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTags(false);
        }
      }
    }

    void loadTags();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

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
        setSeoTitle(article.seoTitle ?? '');
        setSeoDescription(article.seoDescription ?? '');
        setCanonicalUrl(article.canonicalUrl ?? '');
        setSelectedLeadMedia(article.leadMedia ?? null);
        setSelectedOgImage(article.ogImage ?? null);
        setSelectedCompetitionId(article.competitionId ?? '');
        setSelectedMatchId(article.matchId ?? '');
        setSelectedClubIds(article.clubs?.map((assignment) => assignment.clubId) ?? []);
        setSelectedCategoryIds(
          article.categories?.map((assignment) => assignment.categoryId) ?? [],
        );
        setSelectedTagIds(article.tags?.map((assignment) => assignment.tagId) ?? []);
        setSavedArticle(article);
        setScheduledAt(
          article.scheduledAt ? new Date(article.scheduledAt).toISOString().slice(0, 16) : '',
        );
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

  function changeCompetition(competitionId: string) {
    setSelectedCompetitionId(competitionId);
    setSelectedMatchId('');
    setMatches([]);
  }

  function formatMatchOption(match: EditorialMatch) {
    const kickoff = new Intl.DateTimeFormat('de-AT', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Europe/Vienna',
    }).format(new Date(match.kickoff));

    const round = match.matchday !== null ? `${match.matchday}. Spieltag · ` : '';

    return `${round}${match.homeClub.name} – ${match.awayClub.name} · ${kickoff}`;
  }

  function toggleClub(clubId: string) {
    setSelectedClubIds((current) =>
      current.includes(clubId) ? current.filter((id) => id !== clubId) : [...current, clubId],
    );
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
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

  async function loadMedia(cursor?: string) {
    if (!token || loadingMedia) {
      return;
    }

    setLoadingMedia(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        limit: '24',
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
        data?: EditorialMediaList;
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Medien konnten nicht geladen werden.');
      }

      setMediaItems((current) =>
        cursor ? [...current, ...payload.data!.items] : payload.data!.items,
      );
      setMediaNextCursor(payload.data.nextCursor);
    } catch (mediaError) {
      setError(
        mediaError instanceof Error ? mediaError.message : 'Medien konnten nicht geladen werden.',
      );
    } finally {
      setLoadingMedia(false);
    }
  }

  function openMediaPicker(mode: 'content' | 'lead' | 'og') {
    if (mode === 'content' && !editor) {
      return;
    }

    setMediaPickerMode(mode);
    setMediaPickerOpen(true);
    setMediaItems([]);
    setMediaNextCursor(null);
    void loadMedia();
  }

  function insertImage() {
    openMediaPicker('content');
  }

  function selectMediaImage(media: EditorialMediaItem) {
    if (mediaPickerMode === 'lead') {
      setSelectedLeadMedia(media);
      setMediaPickerOpen(false);
      setError(undefined);
      return;
    }

    if (mediaPickerMode === 'og') {
      setSelectedOgImage(media);
      setMediaPickerOpen(false);
      setError(undefined);
      return;
    }

    if (!editor) {
      return;
    }

    const src = `${apiUrl}/api/v1/media/${encodeURIComponent(media.id)}/content`;

    editor
      .chain()
      .focus()
      .setImage({
        src,
        alt: media.altText ?? '',
      })
      .run();

    setMediaPickerOpen(false);
    setError(undefined);
  }

  async function saveArticle(): Promise<EditorialArticle | undefined> {
    if (!editor || !token || saving) {
      return undefined;
    }

    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();
    const trimmedLead = lead.trim();
    const trimmedSeoTitle = seoTitle.trim();
    const trimmedSeoDescription = seoDescription.trim();
    const trimmedCanonicalUrl = canonicalUrl.trim();

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
            leadMediaId: selectedLeadMedia?.id ?? null,
            seoTitle: trimmedSeoTitle || null,
            seoDescription: trimmedSeoDescription || null,
            canonicalUrl: trimmedCanonicalUrl || null,
            ogImageId: selectedOgImage?.id ?? null,
            content: editor.getJSON(),
            competitionId: selectedCompetitionId || null,
            matchId: selectedMatchId || null,
            clubIds: selectedClubIds,
            categoryIds: selectedCategoryIds,
            tagIds: selectedTagIds,
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
      return article;
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Artikel konnte nicht gespeichert werden.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePublicationStatus(
    status: ArticleStatus,
    options?: { scheduledAt?: string },
  ) {
    if (!articleId || !token || changingStatus || saving) {
      return;
    }

    setChangingStatus(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const saved = await saveArticle();

      if (!saved) {
        throw new Error('Artikel konnte vor dem Statuswechsel nicht gespeichert werden.');
      }

      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/publication`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            ...(status === 'SCHEDULED'
              ? {
                  scheduledAt: options?.scheduledAt,
                }
              : {}),
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        data?: EditorialArticle;
        error?: {
          message?: string;
        };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(
          payload?.error?.message ?? 'Publikationsstatus konnte nicht geändert werden.',
        );
      }

      setSavedArticle(payload.data);
      setScheduledAt(
        payload.data.scheduledAt
          ? new Date(payload.data.scheduledAt).toISOString().slice(0, 16)
          : '',
      );

      const messages: Record<ArticleStatus, string> = {
        DRAFT: 'Artikel ist wieder ein Entwurf.',
        REVIEW: 'Artikel wurde zur Prüfung eingereicht.',
        SCHEDULED: 'Veröffentlichung wurde geplant.',
        PUBLISHED: 'Artikel wurde veröffentlicht.',
        ARCHIVED: 'Artikel wurde archiviert.',
      };

      setMessage(messages[status]);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'Publikationsstatus konnte nicht geändert werden.',
      );
    } finally {
      setChangingStatus(false);
    }
  }

  function scheduleArticle() {
    if (!scheduledAt) {
      setError('Bitte einen Zeitpunkt für die geplante Veröffentlichung wählen.');
      return;
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      setError('Der Veröffentlichungszeitpunkt muss in der Zukunft liegen.');
      return;
    }

    void changePublicationStatus('SCHEDULED', {
      scheduledAt: date.toISOString(),
    });
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
      <Link href="/admin/artikel" className={styles.backLink}>
        ← Zur Artikelübersicht
      </Link>

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
          <Button disabled={!editor || saving || changingStatus} onClick={() => void saveArticle()}>
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
            <span className={styles.sidebarLabel}>Publikation</span>
            <strong>{savedArticle ? savedArticle.status : 'DRAFT'}</strong>

            {!articleId ? (
              <p>Speichere den Artikel zuerst, bevor du den Publikationsstatus änderst.</p>
            ) : null}

            {articleId && savedArticle?.status === 'DRAFT' ? (
              <Button
                variant="secondary"
                disabled={saving || changingStatus}
                onClick={() => void changePublicationStatus('REVIEW')}
              >
                Zur Prüfung
              </Button>
            ) : null}

            {articleId && savedArticle?.status === 'REVIEW' ? (
              <div className={styles.publicationActions}>
                <Button
                  variant="secondary"
                  disabled={saving || changingStatus}
                  onClick={() => void changePublicationStatus('DRAFT')}
                >
                  Zurück zu Entwurf
                </Button>

                <Button
                  disabled={saving || changingStatus}
                  onClick={() => void changePublicationStatus('PUBLISHED')}
                >
                  Jetzt veröffentlichen
                </Button>

                <label className={styles.scheduleField}>
                  <span>Veröffentlichung planen</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                </label>

                <Button
                  variant="outline"
                  disabled={saving || changingStatus || !scheduledAt}
                  onClick={scheduleArticle}
                >
                  Planen
                </Button>
              </div>
            ) : null}

            {articleId && savedArticle?.status === 'SCHEDULED' ? (
              <div className={styles.publicationActions}>
                {savedArticle.scheduledAt ? (
                  <p>
                    Geplant für{' '}
                    {new Intl.DateTimeFormat('de-AT', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Europe/Vienna',
                    }).format(new Date(savedArticle.scheduledAt))}{' '}
                    Uhr
                  </p>
                ) : null}

                <Button
                  variant="secondary"
                  disabled={saving || changingStatus}
                  onClick={() => void changePublicationStatus('REVIEW')}
                >
                  Zurück zur Prüfung
                </Button>

                <Button
                  disabled={saving || changingStatus}
                  onClick={() => void changePublicationStatus('PUBLISHED')}
                >
                  Jetzt veröffentlichen
                </Button>
              </div>
            ) : null}

            {articleId && savedArticle?.status === 'PUBLISHED' ? (
              <div className={styles.publicationActions}>
                <p>Der Artikel ist öffentlich sichtbar.</p>

                <Button
                  variant="outline"
                  disabled={saving || changingStatus}
                  onClick={() => void changePublicationStatus('ARCHIVED')}
                >
                  Archivieren
                </Button>
              </div>
            ) : null}

            {articleId && savedArticle?.status === 'ARCHIVED' ? (
              <Button
                variant="secondary"
                disabled={saving || changingStatus}
                onClick={() => void changePublicationStatus('DRAFT')}
              >
                Zurück zu Entwurf
              </Button>
            ) : null}
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Wettbewerb</span>
            {loadingCompetitions ? (
              <p>Wettbewerbe werden geladen …</p>
            ) : competitions.length === 0 ? (
              <p>Keine Wettbewerbe vorhanden.</p>
            ) : (
              <select
                className={styles.competitionSelect}
                value={selectedCompetitionId}
                disabled={saving || changingStatus}
                onChange={(event) => changeCompetition(event.target.value)}
              >
                <option value="">Kein Wettbewerb</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>
            )}
            <p>
              {selectedCompetitionId
                ? 'Ein Wettbewerb ist diesem Artikel zugeordnet.'
                : 'Kein Wettbewerb ausgewählt.'}
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Spiel</span>

            {!selectedCompetitionId ? (
              <p>Wähle zuerst einen Wettbewerb aus.</p>
            ) : loadingMatches ? (
              <p>Spiele werden geladen …</p>
            ) : matches.length === 0 ? (
              <p>Für diesen Wettbewerb sind keine Spiele vorhanden.</p>
            ) : (
              <select
                className={styles.competitionSelect}
                value={selectedMatchId}
                disabled={saving || changingStatus}
                onChange={(event) => setSelectedMatchId(event.target.value)}
              >
                <option value="">Kein Spiel</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {formatMatchOption(match)}
                  </option>
                ))}
              </select>
            )}

            <p>
              {selectedMatchId
                ? 'Ein Spiel ist diesem Artikel zugeordnet.'
                : 'Kein Spiel ausgewählt.'}
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Vereine</span>

            {loadingClubs ? (
              <p>Vereine werden geladen …</p>
            ) : clubs.length === 0 ? (
              <p>Keine aktiven Vereine vorhanden.</p>
            ) : (
              <div className={styles.categoryList}>
                {clubs.map((club) => {
                  const checked = selectedClubIds.includes(club.id);

                  return (
                    <label key={club.id} className={styles.categoryOption}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving || changingStatus}
                        onChange={() => toggleClub(club.id)}
                      />
                      <span>{club.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <p>
              {selectedClubIds.length === 0
                ? 'Kein Verein ausgewählt.'
                : `${selectedClubIds.length} ${
                    selectedClubIds.length === 1 ? 'Verein' : 'Vereine'
                  } ausgewählt.`}
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Kategorien</span>

            {loadingCategories ? (
              <p>Kategorien werden geladen …</p>
            ) : categories.length === 0 ? (
              <p>Keine aktiven Kategorien vorhanden.</p>
            ) : (
              <div className={styles.categoryList}>
                {categories.map((category) => {
                  const checked = selectedCategoryIds.includes(category.id);

                  return (
                    <label key={category.id} className={styles.categoryOption}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving || changingStatus}
                        onChange={() => toggleCategory(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <p>
              {selectedCategoryIds.length === 0
                ? 'Keine Kategorie ausgewählt.'
                : `${selectedCategoryIds.length} ${
                    selectedCategoryIds.length === 1 ? 'Kategorie' : 'Kategorien'
                  } ausgewählt.`}
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Tags</span>

            {loadingTags ? (
              <p>Tags werden geladen …</p>
            ) : tags.length === 0 ? (
              <p>Keine aktiven Tags vorhanden.</p>
            ) : (
              <div className={styles.categoryList}>
                {tags.map((tag) => {
                  const checked = selectedTagIds.includes(tag.id);

                  return (
                    <label key={tag.id} className={styles.categoryOption}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving || changingStatus}
                        onChange={() => toggleTag(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <p>
              {selectedTagIds.length === 0
                ? 'Keine Tags ausgewählt.'
                : `${selectedTagIds.length} ${
                    selectedTagIds.length === 1 ? 'Tag' : 'Tags'
                  } ausgewählt.`}
            </p>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Leadbild</span>

            {selectedLeadMedia ? (
              <div className={styles.leadMedia}>
                <div className={styles.leadMediaPreview}>
                  {/* Media content is served by our authenticated editorial API. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${apiUrl}/api/v1/media/${encodeURIComponent(
                      selectedLeadMedia.id,
                    )}/content`}
                    alt={selectedLeadMedia.altText ?? ''}
                  />
                </div>

                <strong>{selectedLeadMedia.originalFileName ?? 'Bild'}</strong>

                <div className={styles.leadMediaActions}>
                  <Button variant="secondary" onClick={() => openMediaPicker('lead')}>
                    Ändern
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedLeadMedia(null)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p>Noch kein Leadbild ausgewählt.</p>
                <Button variant="secondary" onClick={() => openMediaPicker('lead')}>
                  Leadbild auswählen
                </Button>
              </>
            )}
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>SEO</span>

            <Field label="SEO-Titel">
              <Input
                value={seoTitle}
                maxLength={300}
                disabled={saving || changingStatus}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder={title || 'SEO-Titel'}
              />
            </Field>

            <Field label="SEO-Beschreibung">
              <Textarea
                value={seoDescription}
                maxLength={500}
                disabled={saving || changingStatus}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder={lead || 'Kurze Beschreibung für Suchmaschinen'}
              />
            </Field>

            <Field label="Canonical URL">
              <Input
                type="url"
                value={canonicalUrl}
                disabled={saving || changingStatus}
                onChange={(event) => setCanonicalUrl(event.target.value)}
                placeholder="https://kurvenfunk.at/artikel/..."
              />
            </Field>

            <span className={styles.sidebarLabel}>OG-Bild</span>

            {selectedOgImage ? (
              <div className={styles.leadMedia}>
                <div className={styles.leadMediaPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${apiUrl}/api/v1/media/${encodeURIComponent(selectedOgImage.id)}/content`}
                    alt={selectedOgImage.altText ?? ''}
                  />
                </div>

                <strong>{selectedOgImage.originalFileName ?? 'Bild'}</strong>

                <div className={styles.leadMediaActions}>
                  <Button variant="secondary" onClick={() => openMediaPicker('og')}>
                    Ändern
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOgImage(null)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p>Noch kein OG-Bild ausgewählt.</p>
                <Button variant="secondary" onClick={() => openMediaPicker('og')}>
                  OG-Bild auswählen
                </Button>
              </>
            )}
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.sidebarLabel}>Editor</span>
            <p>
              Unterstützt Text, H2–H4, Links, Listen, Zitate und Bilder aus der Medienbibliothek.
            </p>
          </section>
        </aside>
      </div>

      {mediaPickerOpen ? (
        <div
          className={styles.mediaPickerBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMediaPickerOpen(false);
            }
          }}
        >
          <section
            className={styles.mediaPicker}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-media-picker-title"
          >
            <header className={styles.mediaPickerHeader}>
              <div>
                <span className={styles.sidebarLabel}>Medienbibliothek</span>
                <h2 id="article-media-picker-title">
                  {mediaPickerMode === 'lead'
                    ? 'Leadbild auswählen'
                    : mediaPickerMode === 'og'
                      ? 'OG-Bild auswählen'
                      : 'Bild einfügen'}
                </h2>
              </div>

              <button
                type="button"
                className={styles.mediaPickerClose}
                aria-label="Medienbibliothek schließen"
                onClick={() => setMediaPickerOpen(false)}
              >
                ×
              </button>
            </header>

            <div className={styles.mediaPickerBody}>
              {loadingMedia && mediaItems.length === 0 ? (
                <p className={styles.mediaPickerState}>Medien werden geladen …</p>
              ) : mediaItems.length === 0 ? (
                <div className={styles.mediaPickerState}>
                  <p>Noch keine Medien vorhanden.</p>
                  <Link href="/admin/medien">Zur Medienbibliothek</Link>
                </div>
              ) : (
                <div className={styles.mediaPickerGrid}>
                  {mediaItems.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      className={styles.mediaPickerItem}
                      onClick={() => selectMediaImage(media)}
                    >
                      {/* Media content is served by our authenticated editorial API. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${apiUrl}/api/v1/media/${encodeURIComponent(media.id)}/content`}
                        alt={media.altText ?? ''}
                      />
                      <span>{media.originalFileName ?? 'Bild'}</span>
                    </button>
                  ))}
                </div>
              )}

              {mediaNextCursor ? (
                <div className={styles.mediaPickerMore}>
                  <Button
                    variant="secondary"
                    disabled={loadingMedia}
                    onClick={() => void loadMedia(mediaNextCursor)}
                  >
                    {loadingMedia ? 'Lädt …' : 'Mehr laden'}
                  </Button>
                </div>
              ) : null}
            </div>

            <footer className={styles.mediaPickerFooter}>
              <Link href="/admin/medien">Medienbibliothek verwalten</Link>
              <Button variant="outline" onClick={() => setMediaPickerOpen(false)}>
                Abbrechen
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
