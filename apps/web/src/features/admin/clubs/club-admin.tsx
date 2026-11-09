'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './club-admin.module.css';

interface Club {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  color1Hex: string;
  color2Hex: string | null;
  color3Hex: string | null;
  accentColorHex: string | null;
  website: string | null;
  logoMediaId: string | null;
  active: boolean;
}

interface ClubDraft {
  name: string;
  shortName: string;
  slug: string;
  color1Hex: string;
  color2Hex: string;
  color3Hex: string;
  accentColorHex: string;
  website: string;
  logoMediaId: string;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string };
}

const emptyDraft: ClubDraft = {
  name: '',
  shortName: '',
  slug: '',
  color1Hex: '#000000',
  color2Hex: '',
  color3Hex: '',
  accentColorHex: '',
  website: '',
  logoMediaId: '',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/, '');
}

function toDraft(club: Club): ClubDraft {
  return {
    name: club.name,
    shortName: club.shortName ?? '',
    slug: club.slug,
    color1Hex: club.color1Hex,
    color2Hex: club.color2Hex ?? '',
    color3Hex: club.color3Hex ?? '',
    accentColorHex: club.accentColorHex ?? '',
    website: club.website ?? '',
    logoMediaId: club.logoMediaId ?? '',
  };
}

function normalizeColor(value: string): string | null {
  return value.trim().toUpperCase() || null;
}

function buildPayload(draft: ClubDraft) {
  return {
    name: draft.name.trim(),
    shortName: draft.shortName.trim() || null,
    color1Hex: draft.color1Hex.trim().toUpperCase(),
    color2Hex: normalizeColor(draft.color2Hex),
    color3Hex: normalizeColor(draft.color3Hex),
    accentColorHex: normalizeColor(draft.accentColorHex),
    website: draft.website.trim() || null,
    logoMediaId: draft.logoMediaId.trim() || null,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    throw new Error(payload?.error?.message ?? 'Die Anfrage konnte nicht abgeschlossen werden.');
  }
  return payload.data;
}

function ClubColorInput({
  label,
  color,
  onChange,
  required = false,
}: {
  label: string;
  color: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(color);
  return (
    <label className={styles.colorField}>
      <span>{label}</span>
      <span className={styles.colorRow}>
        <span
          className={styles.swatch}
          style={{ backgroundColor: valid ? color : 'transparent' }}
          aria-hidden="true"
        />
        <input
          type="text"
          required={required}
          maxLength={7}
          pattern="#[0-9a-fA-F]{6}"
          placeholder={required ? '#00794C' : 'Optional'}
          value={color}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function ClubEditor({
  draft,
  onChange,
  onSubmit,
  busy,
  creating,
  onCancel,
}: {
  draft: ClubDraft;
  onChange: (next: ClubDraft) => void;
  onSubmit: () => void;
  busy: boolean;
  creating: boolean;
  onCancel?: () => void;
}) {
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Vereinsname
        <input
          required
          maxLength={120}
          value={draft.name}
          onChange={(event) =>
            onChange({
              ...draft,
              name: event.target.value,
              slug: creating ? slugify(event.target.value) : draft.slug,
            })
          }
        />
      </label>
      <label>
        Slug (dauerhafte Identität)
        <input
          required
          disabled={!creating}
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={draft.slug}
          onChange={(event) => onChange({ ...draft, slug: event.target.value })}
        />
      </label>
      <label>
        Kurzname (optional)
        <input
          maxLength={60}
          value={draft.shortName}
          onChange={(event) => onChange({ ...draft, shortName: event.target.value })}
        />
      </label>
      <ClubColorInput
        label="Primärfarbe"
        required
        color={draft.color1Hex}
        onChange={(value) => onChange({ ...draft, color1Hex: value })}
      />
      <ClubColorInput
        label="Sekundärfarbe"
        color={draft.color2Hex}
        onChange={(value) => onChange({ ...draft, color2Hex: value })}
      />
      <ClubColorInput
        label="Dritte Farbe"
        color={draft.color3Hex}
        onChange={(value) => onChange({ ...draft, color3Hex: value })}
      />
      <ClubColorInput
        label="Akzentfarbe"
        color={draft.accentColorHex}
        onChange={(value) => onChange({ ...draft, accentColorHex: value })}
      />
      <label>
        Offizielle Website (optional)
        <input
          type="url"
          maxLength={2048}
          placeholder="https://verein.example"
          value={draft.website}
          onChange={(event) => onChange({ ...draft, website: event.target.value })}
        />
      </label>
      <label>
        Logo-Medien-ID (optional)
        <input
          type="text"
          placeholder="UUID eines freigegebenen Bildmediums"
          value={draft.logoMediaId}
          onChange={(event) => onChange({ ...draft, logoMediaId: event.target.value })}
        />
      </label>
      <p className={styles.hint}>
        Nur vorhandene, freigegebene Bildmedien verwenden. Vereinsfarben werden als Branding
        gespeichert, nicht als ungeprüfte Text- oder Hintergrundfarben angewendet.
      </p>
      <div className={styles.actions}>
        <button type="submit" disabled={busy}>
          {creating ? 'Verein erstellen' : 'Änderungen speichern'}
        </button>
        {onCancel ? (
          <button type="button" disabled={busy} onClick={onCancel}>
            Abbrechen
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function ClubAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [newClub, setNewClub] = useState<ClubDraft>({ ...emptyDraft });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClubDraft>({ ...emptyDraft });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !authenticated || !token) return;
    let cancelled = false;
    async function loadInitial() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await parseResponse<Club[]>(response);
        if (!cancelled) setClubs(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, initialized, authenticated, token]);

  async function refresh(): Promise<void> {
    if (!token) return;
    const response = await fetch(`${apiUrl}/api/v1/clubs/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    setClubs(await parseResponse<Club[]>(response));
  }

  async function save(
    method: 'POST' | 'PATCH',
    path: string,
    input: unknown,
  ): Promise<void> {
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/clubs${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      await parseResponse<Club>(response);
      await refresh();
      setEditingId(null);
      if (method === 'POST') setNewClub({ ...emptyDraft });
      setMessage('Vereinsdaten wurden gespeichert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Vereinsverwaltung wird geladen …</p>;
  }
  if (!authenticated || !token) return null;

  const visible = clubs.filter((club) =>
    [club.name, club.shortName ?? '', club.slug].some((value) =>
      value.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  );

  return (
    <section className={styles.page} aria-labelledby="clubs-admin-title">
      <header>
        <h2 id="clubs-admin-title">Vereine verwalten</h2>
        <p>
          Kanonische Vereinsdaten und Farben für kurvenfunk. Auch deaktivierte Vereine bleiben
          historisch erhalten.
        </p>
      </header>

      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className={styles.success}>
          {message}
        </p>
      ) : null}

      <section className={styles.panel} aria-labelledby="new-club-title">
        <h3 id="new-club-title">Neuer Verein</h3>
        <ClubEditor
          draft={newClub}
          onChange={setNewClub}
          busy={busy}
          creating
          onSubmit={() =>
            void save('POST', '', { ...buildPayload(newClub), slug: newClub.slug })
          }
        />
      </section>

      <section className={styles.panel} aria-labelledby="club-list-title">
        <h3 id="club-list-title">Bestehende Vereine ({clubs.length})</h3>
        <label className={styles.search}>
          Vereine suchen
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Kurzname oder Kennung"
          />
        </label>
        {visible.length === 0 ? <p>Keine passenden Vereine gefunden.</p> : null}
        <div className={styles.list}>
          {visible.map((club) => (
            <article className={styles.item} key={club.id}>
              <div className={styles.heading}>
                <div>
                  <h4>{club.name}</h4>
                  <p>
                    {club.shortName ? `${club.shortName} · ` : null}
                    <code>{club.slug}</code>
                  </p>
                  <div className={styles.colors} aria-label="Gespeicherte Vereinsfarben">
                    {[
                      ['Primär', club.color1Hex],
                      ['Sekundär', club.color2Hex],
                      ['Dritte', club.color3Hex],
                      ['Akzent', club.accentColorHex],
                    ].filter((pair) => pair[1] !== null).map(([label, color]) => (
                      <span className={styles.colorChip} key={label}>
                        <span
                          className={styles.swatch}
                          style={{ backgroundColor: color ?? 'transparent' }}
                          aria-hidden="true"
                        />
                        {label}: {color}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={club.active ? styles.active : styles.inactive}>
                  {club.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              {editingId === club.id ? (
                <ClubEditor
                  draft={draft}
                  onChange={setDraft}
                  busy={busy}
                  creating={false}
                  onCancel={() => setEditingId(null)}
                  onSubmit={() => void save('PATCH', `/${club.id}`, buildPayload(draft))}
                />
              ) : (
                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(club.id);
                      setDraft(toDraft(club));
                      setError(null);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const action = club.active ? 'deaktivieren' : 'aktivieren';
                      if (!window.confirm(`„${club.name}“ wirklich ${action}?`)) return;
                      void save('PATCH', `/${club.id}`, { active: !club.active });
                    }}
                  >
                    {club.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
