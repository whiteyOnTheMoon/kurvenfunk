'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './match-admin.module.css';

type FixtureStatus = 'SCHEDULED' | 'POSTPONED' | 'CANCELLED';
type StoredStatus = FixtureStatus | 'LIVE' | 'FINISHED' | 'ABANDONED';

interface Competition {
  id: string;
  slug: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Club {
  id: string;
  name: string;
  shortName: string | null;
}

interface Stage {
  id: string;
  name: string;
  slug: string;
}

interface Fixture {
  id: string;
  competitionId: string;
  seasonId: string;
  homeClubId: string;
  awayClubId: string;
  stageId: string | null;
  kickoff: string;
  matchday: number | null;
  status: StoredStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: Club;
  awayClub: Club;
}

interface SeasonFixtures {
  season: Season & {
    competitionId: string;
    stages: Stage[];
  };
  matches: Fixture[];
}

interface FixtureDraft {
  homeClubId: string;
  awayClubId: string;
  stageId: string;
  kickoff: string;
  matchday: string;
  status: FixtureStatus;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string | string[] };
}

const statusNames: Record<StoredStatus, string> = {
  SCHEDULED: 'Angesetzt',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  ABANDONED: 'Abgebrochen',
};

const editableStatuses: FixtureStatus[] = ['SCHEDULED', 'POSTPONED', 'CANCELLED'];

const emptyDraft: FixtureDraft = {
  homeClubId: '',
  awayClubId: '',
  stageId: '',
  kickoff: '',
  matchday: '',
  status: 'SCHEDULED',
};

function localDateTime(iso: string): string {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toDraft(fixture: Fixture): FixtureDraft {
  return {
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    stageId: fixture.stageId ?? '',
    kickoff: localDateTime(fixture.kickoff),
    matchday: fixture.matchday === null ? '' : String(fixture.matchday),
    status: fixture.status as FixtureStatus,
  };
}

function toPayload(draft: FixtureDraft) {
  return {
    homeClubId: draft.homeClubId,
    awayClubId: draft.awayClubId,
    stageId: draft.stageId || null,
    kickoff: new Date(draft.kickoff).toISOString(),
    matchday: draft.matchday === '' ? null : Number(draft.matchday),
    status: draft.status,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    const reason = payload?.error?.message;
    throw new Error(
      Array.isArray(reason)
        ? reason.join(', ')
        : (reason ?? 'Die Anfrage konnte nicht abgeschlossen werden.'),
    );
  }
  return payload.data;
}

function FixtureEditor({
  draft,
  onChange,
  onSubmit,
  onCancel,
  clubs,
  stages,
  busy,
  creating,
}: {
  draft: FixtureDraft;
  onChange: (draft: FixtureDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  clubs: Club[];
  stages: Stage[];
  busy: boolean;
  creating: boolean;
}) {
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.homeClubId === draft.awayClubId) return;
        onSubmit();
      }}
    >
      <label>
        Heimverein
        <select
          required
          value={draft.homeClubId}
          onChange={(event) => onChange({ ...draft, homeClubId: event.target.value })}
        >
          <option value="">Heimverein wählen</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Auswärtsverein
        <select
          required
          value={draft.awayClubId}
          onChange={(event) => onChange({ ...draft, awayClubId: event.target.value })}
        >
          <option value="">Auswärtsverein wählen</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Phase
        <select
          value={draft.stageId}
          onChange={(event) => onChange({ ...draft, stageId: event.target.value })}
        >
          <option value="">Keine Phase</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Anstoß (lokale Gerätezeit)
        <input
          type="datetime-local"
          required
          value={draft.kickoff}
          onChange={(event) => onChange({ ...draft, kickoff: event.target.value })}
        />
      </label>
      <label>
        Spieltag (optional)
        <input
          type="number"
          min={1}
          max={999}
          step={1}
          value={draft.matchday}
          onChange={(event) => onChange({ ...draft, matchday: event.target.value })}
        />
      </label>
      <label>
        Spielstatus
        <select
          value={draft.status}
          onChange={(event) => onChange({ ...draft, status: event.target.value as FixtureStatus })}
        >
          {editableStatuses.map((value) => (
            <option key={value} value={value}>
              {statusNames[value]}
            </option>
          ))}
        </select>
      </label>
      {draft.homeClubId && draft.homeClubId === draft.awayClubId ? (
        <p className={styles.error} role="alert">
          Heim- und Auswärtsverein müssen verschieden sein.
        </p>
      ) : null}
      <div className={styles.actions}>
        <button
          disabled={
            busy ||
            clubs.length < 2 ||
            !draft.homeClubId ||
            !draft.awayClubId ||
            draft.homeClubId === draft.awayClubId
          }
          type="submit"
        >
          {creating ? 'Spiel anlegen' : 'Spiel aktualisieren'}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} disabled={busy}>
            Abbrechen
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function MatchAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionSlug, setCompetitionSlug] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fixtures, setFixtures] = useState<SeasonFixtures | null>(null);
  const [draft, setDraft] = useState<FixtureDraft>({ ...emptyDraft });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FixtureDraft>({ ...emptyDraft });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !authenticated || !initialized) return;
    let cancelled = false;
    async function load() {
      try {
        const [competitionResponse, clubsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
          fetch(`${apiUrl}/api/v1/clubs`, { cache: 'no-store' }),
        ]);
        const competitionList = await parseResponse<Competition[]>(competitionResponse);
        const clubList = await parseResponse<Club[]>(clubsResponse);
        if (!cancelled) {
          setCompetitions(competitionList);
          setClubs(clubList);
          setCompetitionSlug(competitionList[0]?.slug ?? '');
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  useEffect(() => {
    if (!competitionSlug || !token) return;
    let cancelled = false;
    async function loadSeasons() {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/seasons/competition/${encodeURIComponent(competitionSlug)}`,
          { cache: 'no-store' },
        );
        const list = await parseResponse<Season[]>(response);
        if (!cancelled) {
          setSeasons(list);
          setSeasonId(list.find((item) => item.status === 'ACTIVE')?.id ?? list[0]?.id ?? '');
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Saisonen fehlen.');
      }
    }
    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, competitionSlug, token]);

  useEffect(() => {
    if (!seasonId || !token) return;
    let cancelled = false;
    async function loadMatches() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/matches/admin/season/${seasonId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const result = await parseResponse<SeasonFixtures>(response);
        if (!cancelled) setFixtures(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Spielplan fehlt.');
      }
    }
    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, seasonId, token]);

  async function refresh() {
    if (!token || !seasonId) return;
    const response = await fetch(`${apiUrl}/api/v1/matches/admin/season/${seasonId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    setFixtures(await parseResponse<SeasonFixtures>(response));
  }

  async function save(method: 'POST' | 'PATCH', id: string | null, data: FixtureDraft) {
    if (!token || !fixtures) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = toPayload(data);
      const input =
        method === 'POST'
          ? {
              ...payload,
              competitionId: fixtures.season.competitionId,
              seasonId: fixtures.season.id,
            }
          : payload;
      const response = await fetch(`${apiUrl}/api/v1/matches${id ? `/${id}` : ''}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      await parseResponse<Fixture>(response);
      await refresh();
      setDraft({ ...emptyDraft });
      setEditingId(null);
      setMessage('Spielansetzung wurde gespeichert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Spielverwaltung wird geladen …</p>;
  }
  if (!authenticated || !token) return null;

  return (
    <section className={styles.page} aria-labelledby="match-admin-title">
      <header>
        <h2 id="match-admin-title">Spielansetzungen verwalten</h2>
        <p>
          Teams, Spieltage, Phasen und Anstoßzeiten pflegen oder Spiele verschieben. Ergebnisse und
          Live-Spiele werden erst in der gesonderten Ergebnisverwaltung bearbeitet.
        </p>
      </header>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={styles.success} role="status">
          {message}
        </p>
      ) : null}
      <div className={styles.filters}>
        <label>
          Wettbewerb
          <select
            value={competitionSlug}
            onChange={(event) => {
              setCompetitionSlug(event.target.value);
              setSeasons([]);
              setSeasonId('');
              setFixtures(null);
              setEditingId(null);
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.slug}>
                {competition.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Saison
          <select
            value={seasonId}
            onChange={(event) => {
              setSeasonId(event.target.value);
              setFixtures(null);
              setEditingId(null);
            }}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.status})
              </option>
            ))}
          </select>
        </label>
      </div>
      {fixtures ? (
        <>
          <section className={styles.panel} aria-labelledby="fixture-create-title">
            <h3 id="fixture-create-title">Neue Spielansetzung</h3>
            <FixtureEditor
              draft={draft}
              onChange={setDraft}
              onSubmit={() => void save('POST', null, draft)}
              clubs={clubs}
              stages={fixtures.season.stages}
              busy={busy}
              creating
            />
          </section>
          <section className={styles.panel} aria-labelledby="fixture-list-title">
            <h3 id="fixture-list-title">Spiele der Saison ({fixtures.matches.length})</h3>
            {fixtures.matches.length === 0 ? (
              <p>Für diese Saison sind noch keine Spiele angelegt.</p>
            ) : null}
            <div className={styles.list}>
              {fixtures.matches.map((match) => {
                const editable =
                  editableStatuses.includes(match.status as FixtureStatus) &&
                  match.homeScore === null &&
                  match.awayScore === null;
                return (
                  <article key={match.id} className={styles.match}>
                    <div className={styles.heading}>
                      <div>
                        <h4>
                          {match.homeClub.name} – {match.awayClub.name}
                        </h4>
                        <p>
                          {new Date(match.kickoff).toLocaleString('de-AT')} ·
                          {match.matchday === null
                            ? ' ohne Spieltag'
                            : ` Spieltag ${match.matchday}`}
                          {match.stageId
                            ? ` · ${match.stageId === fixtures.season.stages.find((stage) => stage.id === match.stageId)?.id ? fixtures.season.stages.find((stage) => stage.id === match.stageId)?.name : 'Phase'}`
                            : ''}
                        </p>
                      </div>
                      <span>{statusNames[match.status]}</span>
                    </div>
                    {editingId === match.id ? (
                      <FixtureEditor
                        draft={editing}
                        onChange={setEditing}
                        onSubmit={() => void save('PATCH', match.id, editing)}
                        onCancel={() => setEditingId(null)}
                        clubs={clubs}
                        stages={fixtures.season.stages}
                        busy={busy}
                        creating={false}
                      />
                    ) : editable ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(match.id);
                          setEditing(toDraft(match));
                          setError(null);
                        }}
                      >
                        Bearbeiten / verschieben
                      </button>
                    ) : (
                      <p className={styles.locked}>
                        Ergebnis-/Live-Spiel: nur lesbar. Bearbeitung folgt mit Task 196.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <p role="status">Wettbewerb und Saison wählen, um den Spielplan zu laden.</p>
      )}
    </section>
  );
}
