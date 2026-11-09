'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './standing-admin.module.css';

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
interface Stage {
  id: string;
  name: string;
  slug: string;
  sequence: number;
}
interface Club {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
}
interface Row {
  id: string;
  stageId: string | null;
  clubId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  deductionPoints: number;
  sortOrder: number | null;
  updatedAt: string;
  club: Club;
}
interface TableData {
  season: Season & {
    competitionId: string;
    stages: Stage[];
  };
  stage: Stage | null;
  standings: Row[];
}
interface Draft {
  clubId: string;
  position: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  deductionPoints: number;
  sortOrder: string;
}
interface CalculationRow {
  clubId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  deductionPoints: number;
  existingId: string | null;
  changed: boolean;
}
interface CalculationPreview {
  seasonId: string;
  stageId: string | null;
  profile: string;
  finishedMatches: number;
  excludedMatches: number;
  existingCount: number;
  previewHash: string;
  canApply: boolean;
  unresolvedTies: string[][];
  rows: CalculationRow[];
}
interface CalculationApplyResult {
  created: number;
  updated: number;
  unchanged: number;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string | string[] };
}

const emptyDraft: Draft = {
  clubId: '',
  position: 1,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  deductionPoints: 0,
  sortOrder: '',
};

function toDraft(row: Row): Draft {
  return {
    clubId: row.clubId,
    position: row.position,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    points: row.points,
    deductionPoints: row.deductionPoints,
    sortOrder: row.sortOrder === null ? '' : String(row.sortOrder),
  };
}

function rowValues(draft: Draft) {
  return {
    position: draft.position,
    played: draft.won + draft.drawn + draft.lost,
    won: draft.won,
    drawn: draft.drawn,
    lost: draft.lost,
    goalsFor: draft.goalsFor,
    goalsAgainst: draft.goalsAgainst,
    points: draft.points,
    deductionPoints: draft.deductionPoints,
    sortOrder: draft.sortOrder === '' ? null : Number(draft.sortOrder),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    const reason = payload?.error?.message;
    throw new Error(
      Array.isArray(reason) ? reason.join(', ') : (reason ?? 'Anfrage fehlgeschlagen.'),
    );
  }
  return payload.data;
}

function StandingEditor({
  draft,
  onChange,
  onSubmit,
  onCancel,
  busy,
  clubs,
  creating,
}: {
  draft: Draft;
  onChange: (value: Draft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  busy: boolean;
  clubs: Club[];
  creating: boolean;
}) {
  function numberField(label: string, key: Exclude<keyof Draft, 'clubId' | 'sortOrder'>) {
    return (
      <label key={key}>
        {label}
        <input
          type="number"
          required
          min={key === 'position' ? 1 : key === 'points' ? -10000 : 0}
          max={10000}
          step={1}
          value={draft[key]}
          onChange={(event) =>
            onChange({
              ...draft,
              [key]: event.target.value === '' ? 0 : Number(event.target.value),
            })
          }
        />
      </label>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Verein
        <select
          required
          value={draft.clubId}
          disabled={!creating}
          onChange={(event) => onChange({ ...draft, clubId: event.target.value })}
        >
          <option value="">Verein auswählen</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
          {!creating && !clubs.some((club) => club.id === draft.clubId) ? (
            <option value={draft.clubId}>Historischer Verein</option>
          ) : null}
        </select>
      </label>
      {numberField('Platz', 'position')}
      {numberField('Siege', 'won')}
      {numberField('Unentschieden', 'drawn')}
      {numberField('Niederlagen', 'lost')}
      {numberField('Tore für', 'goalsFor')}
      {numberField('Tore gegen', 'goalsAgainst')}
      {numberField('Punkte (kanonisch)', 'points')}
      {numberField('Punktabzug', 'deductionPoints')}
      <label>
        Sortierreihenfolge (optional)
        <input
          type="number"
          min={0}
          max={10000}
          step={1}
          value={draft.sortOrder}
          onChange={(event) => onChange({ ...draft, sortOrder: event.target.value })}
        />
      </label>
      <p className={styles.hint}>
        Spiele und Tordifferenz werden aus den eingegebenen Werten abgeleitet. Die Punkte bleiben
        unabhängig, z. B. bei Punktabzügen oder Ligaregeln. Eine automatische Berechnung aus
        Ergebnissen folgt mit Task 198.
      </p>
      <div className={styles.actions}>
        <button type="submit" disabled={busy || !draft.clubId}>
          {creating ? 'Tabellenzeile anlegen' : 'Zeile korrigieren'}
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

export function StandingAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionSlug, setCompetitionSlug] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [stageId, setStageId] = useState('');
  const [availableStages, setAvailableStages] = useState<Stage[]>([]);
  const [table, setTable] = useState<TableData | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft>({ ...emptyDraft });
  const [calculation, setCalculation] = useState<CalculationPreview | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [calculationBusy, setCalculationBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !authenticated || !token) return;
    let cancelled = false;
    async function load() {
      try {
        const [competitionResponse, clubsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
          fetch(`${apiUrl}/api/v1/clubs/admin/all`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
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
  }, [apiUrl, initialized, authenticated, token]);

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
          setSeasonId(list.find((value) => value.status === 'ACTIVE')?.id ?? list[0]?.id ?? '');
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
    async function loadTable() {
      try {
        const query = stageId ? `?stageId=${encodeURIComponent(stageId)}` : '';
        const response = await fetch(
          `${apiUrl}/api/v1/standings/admin/season/${seasonId}${query}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
        );
        const result = await parseResponse<TableData>(response);
        if (!cancelled) {
          setAvailableStages(result.season.stages);
          setTable(result);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Tabelle fehlt.');
      }
    }
    void loadTable();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, seasonId, stageId, token]);

  async function reload() {
    if (!seasonId || !token) return;
    const query = stageId ? `?stageId=${encodeURIComponent(stageId)}` : '';
    const response = await fetch(`${apiUrl}/api/v1/standings/admin/season/${seasonId}${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    setTable(await parseResponse<TableData>(response));
  }

  async function save(row: Row | null, values: Draft) {
    if (!token || !table) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const input = row
        ? { ...rowValues(values), expectedUpdatedAt: row.updatedAt }
        : { ...rowValues(values), stageId: stageId || null, clubId: values.clubId };
      const response = await fetch(
        row
          ? `${apiUrl}/api/v1/standings/admin/rows/${row.id}`
          : `${apiUrl}/api/v1/standings/admin/season/${table.season.id}/rows`,
        {
          method: row ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        },
      );
      if (response.status === 409) {
        setEditingId(null);
        await reload();
        throw new Error('Tabelleneintrag wurde geändert oder existiert bereits. Bitte neu prüfen.');
      }
      await parseResponse<Row>(response);
      await reload();
      setCalculation(null);
      setEditingId(null);
      setDraft({ ...emptyDraft });
      setMessage('Tabellenzeile gespeichert und protokolliert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  async function calculatePreview() {
    if (!token || !seasonId) return;
    setCalculationBusy(true);
    setCalculation(null);
    setOverwriteConfirmed(false);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/standings/admin/season/${seasonId}/calculate/preview`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stageId: stageId || null }),
        },
      );
      setCalculation(await parseResponse<CalculationPreview>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Berechnung nicht verfügbar.');
    } finally {
      setCalculationBusy(false);
    }
  }

  async function applyCalculation() {
    if (!token || !seasonId || !calculation || !calculation.canApply) return;
    if (calculation.seasonId !== seasonId || calculation.stageId !== (stageId || null)) return;
    if (calculation.existingCount > 0 && !overwriteConfirmed) return;
    setCalculationBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/standings/admin/season/${seasonId}/calculate/apply`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stageId: stageId || null,
            expectedPreviewHash: calculation.previewHash,
            overwriteExisting: overwriteConfirmed,
          }),
        },
      );
      if (response.status === 409) {
        setCalculation(null);
        setOverwriteConfirmed(false);
        await reload();
        throw new Error('Daten oder Rangfolge haben sich geändert. Neue Vorschau erstellen.');
      }
      const saved = await parseResponse<CalculationApplyResult>(response);
      await reload();
      setCalculation(null);
      setOverwriteConfirmed(false);
      setMessage(
        `Berechnung angewendet: ${saved.created} neu, ${saved.updated} aktualisiert, ${saved.unchanged} unverändert.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tabellenberechnung fehlgeschlagen.');
    } finally {
      setCalculationBusy(false);
    }
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Tabellenverwaltung wird geladen …</p>;
  }
  if (!authenticated || !token) return null;

  return (
    <section className={styles.page} aria-labelledby="standings-admin-title">
      <header>
        <h2 id="standings-admin-title">Tabellen verwalten</h2>
        <p>
          Manuelle Tabellenzeilen pro Saison und Phase pflegen – ohne automatische Neuberechnung.
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
              setSeasonId('');
              setSeasons([]);
              setStageId('');
              setAvailableStages([]);
              setTable(null);
              setCalculation(null);
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
              setStageId('');
              setAvailableStages([]);
              setTable(null);
              setCalculation(null);
            }}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.status})
              </option>
            ))}
          </select>
        </label>
        <label>
          Tabellenphase
          <select
            value={stageId}
            onChange={(event) => {
              setStageId(event.target.value);
              setEditingId(null);
              setTable(null);
              setCalculation(null);
            }}
          >
            <option value="">Saisontabelle (ohne Phase)</option>
            {availableStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {table ? (
        <>
          <section className={styles.panel} aria-labelledby="standing-calc-title">
            <h3 id="standing-calc-title">Tabelle aus Ergebnissen berechnen</h3>
            <p className={styles.hint}>
              Nur abgeschlossene Spiele werden gezählt. Zuerst Vorschau prüfen, danach ausdrücklich
              übernehmen. Vorhandene Tabellenwerte bleiben bis zur Bestätigung unverändert.
            </p>
            <button
              type="button"
              disabled={busy || calculationBusy}
              onClick={() => void calculatePreview()}
            >
              {calculationBusy ? 'Berechnung läuft …' : 'Berechnungsvorschau erstellen'}
            </button>
            {calculation &&
            calculation.seasonId === seasonId &&
            calculation.stageId === (stageId || null) ? (
              <div className={styles.list} aria-live="polite">
                <p>
                  Regelprofil: <strong>{calculation.profile}</strong> · abgeschlossene Spiele:{' '}
                  {calculation.finishedMatches} · noch nicht abgeschlossene Spiele:{' '}
                  {calculation.excludedMatches}
                </p>
                {calculation.rows.map((row) => (
                  <div key={row.clubId} className={styles.heading}>
                    <span>
                      {row.position}.{' '}
                      {clubs.find((club) => club.id === row.clubId)?.name ?? row.clubId}
                      {' · '}Sp {row.played} · S {row.won} · U {row.drawn} · N {row.lost}
                    </span>
                    <span>
                      {row.goalsFor}:{row.goalsAgainst} · Diff {row.goalDifference}
                      {' · '} {row.points} Punkte
                      {row.changed ? ' · Änderung' : ' · unverändert'}
                    </span>
                  </div>
                ))}
                {calculation.unresolvedTies.length > 0 ? (
                  <p className={styles.error} role="alert">
                    Einige Tabellenplätze sind nach den verfügbaren direkten Duellen und weiteren
                    Kriterien noch nicht eindeutig. Automatisches Übernehmen ist dafür gesperrt.
                  </p>
                ) : null}
                {calculation.finishedMatches === 0 ? (
                  <p role="status">Noch keine endgültigen Spielergebnisse vorhanden.</p>
                ) : null}
                {calculation.existingCount > 0 ? (
                  <label>
                    <input
                      type="checkbox"
                      checked={overwriteConfirmed}
                      onChange={(event) => setOverwriteConfirmed(event.target.checked)}
                    />
                    Ich bestätige das Ersetzen bestehender Tabellenwerte (
                    {calculation.existingCount} Zeilen).
                  </label>
                ) : null}
                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      calculationBusy ||
                      !calculation.canApply ||
                      (calculation.existingCount > 0 && !overwriteConfirmed)
                    }
                    onClick={() => void applyCalculation()}
                  >
                    Vorschau übernehmen
                  </button>
                </div>
              </div>
            ) : null}
          </section>
          <section className={styles.panel} aria-labelledby="standing-add-title">
            <h3 id="standing-add-title">Verein in Tabelle eintragen</h3>
            <StandingEditor
              draft={draft}
              onChange={setDraft}
              onSubmit={() => void save(null, draft)}
              clubs={clubs.filter((club) => !table.standings.some((row) => row.clubId === club.id))}
              busy={busy}
              creating
            />
          </section>
          <section className={styles.panel} aria-labelledby="standing-list-title">
            <h3 id="standing-list-title">
              {table.stage ? table.stage.name : 'Saisontabelle'} ({table.standings.length})
            </h3>
            <div className={styles.list}>
              {table.standings.map((row) => (
                <article className={styles.item} key={row.id}>
                  <div className={styles.heading}>
                    <strong>
                      {row.position}. {row.club.name}
                    </strong>
                    <span>
                      Sp {row.played} · S {row.won} · U {row.drawn} · N {row.lost}
                      {' · '}Tore {row.goalsFor}:{row.goalsAgainst}
                      {' · '}Diff {row.goalDifference}
                      {' · '}Punkte {row.points}
                    </span>
                  </div>
                  {editingId === row.id ? (
                    <StandingEditor
                      draft={editing}
                      onChange={setEditing}
                      onSubmit={() => void save(row, editing)}
                      onCancel={() => setEditingId(null)}
                      clubs={clubs}
                      busy={busy}
                      creating={false}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(row.id);
                        setEditing(toDraft(row));
                        setError(null);
                      }}
                    >
                      Korrigieren
                    </button>
                  )}
                </article>
              ))}
              {table.standings.length === 0 ? <p>Noch keine Tabellenzeilen vorhanden.</p> : null}
            </div>
          </section>
        </>
      ) : (
        <p role="status">Eine Saison auswählen, um die Tabelle zu laden.</p>
      )}
    </section>
  );
}
