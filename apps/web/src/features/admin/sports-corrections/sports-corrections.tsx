'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import { canCorrectSports } from './sports-correction-access';
import styles from './sports-corrections.module.css';

interface Correction {
  id: string;
  entityType: 'CLUB' | 'MATCH';
  externalId: string;
  externalName: string | null;
  status: string;
  clubId: string | null;
  matchId: string | null;
  updatedAt: string;
  reviewedAt: string | null;
  provider: { key: string; name: string };
  club: { name: string } | null;
  match: {
    kickoff: string;
    homeClub: { name: string };
    awayClub: { name: string };
  } | null;
}

interface ClubCandidate {
  id: string;
  name: string;
  slug: string;
}

interface MatchCandidate {
  id: string;
  kickoff: string;
  matchday: number | null;
  homeClub: { name: string };
  awayClub: { name: string };
  competition: { name: string };
  season: { name: string };
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string | string[] };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || body?.data === undefined) {
    const message = body?.error?.message;
    throw new Error(
      typeof message === 'string'
        ? message
        : Array.isArray(message)
          ? message.join(', ')
          : 'Sportdaten-Korrektur konnte nicht abgeschlossen werden.',
    );
  }
  return body.data;
}

function targetLabel(candidate: ClubCandidate | MatchCandidate): string {
  if ('name' in candidate) return candidate.name;
  return `${candidate.homeClub.name} – ${candidate.awayClub.name} · ${new Date(
    candidate.kickoff,
  ).toLocaleString('de-AT')} · ${candidate.competition.name} / ${candidate.season.name}`;
}

export function SportsCorrections({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token, user } = useAuth();
  const allowed = canCorrectSports(user?.roles);
  const [statusFilter, setStatusFilter] = useState<'review' | 'all'>('review');
  const [items, setItems] = useState<Correction[]>([]);
  const [selected, setSelected] = useState<Correction | null>(null);
  const [decision, setDecision] = useState<'MATCH' | 'REJECT'>('MATCH');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<Array<ClubCandidate | MatchCandidate>>([]);
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !authenticated || !token || !allowed) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/imports/sports/corrections?status=${statusFilter}&limit=50`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
        );
        const result = await parseResponse<Correction[]>(response);
        if (!cancelled) {
          setItems(result);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Sport-Zuordnungen nicht verfügbar.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token, allowed, statusFilter]);

  async function reload(): Promise<void> {
    if (!token) return;
    const response = await fetch(
      `${apiUrl}/api/v1/imports/sports/corrections?status=${statusFilter}&limit=50`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    setItems(await parseResponse<Correction[]>(response));
  }

  function choose(item: Correction): void {
    setSelected(item);
    setReason('');
    setSearch('');
    setCandidates([]);
    setTargetId('');
    setDecision('MATCH');
    setError(null);
    setMessage(null);
  }

  async function findCandidates(): Promise<void> {
    if (!token || !selected || search.trim().length < 2) return;
    setSearching(true);
    setError(null);
    setTargetId('');
    try {
      const params = new URLSearchParams({ entityType: selected.entityType, q: search.trim() });
      const response = await fetch(
        `${apiUrl}/api/v1/imports/sports/corrections/candidates?${params}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
      );
      setCandidates(await parseResponse<Array<ClubCandidate | MatchCandidate>>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Zielsuche fehlgeschlagen.');
    } finally {
      setSearching(false);
    }
  }

  async function submit(): Promise<void> {
    if (!token || !selected || busy || reason.trim().length < 10) return;
    if (decision === 'MATCH' && !targetId) return;

    const label = decision === 'MATCH' ? 'manuell zuordnen' : 'als falsch ablehnen';
    if (
      !window.confirm(
        `Provider-ID „${selected.externalId}“ wirklich ${label}? Die Aktion wird protokolliert und ändert keine offiziellen Sportergebnisse.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/imports/sports/corrections/${encodeURIComponent(selected.id)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision,
            ...(decision === 'MATCH' ? { targetId } : {}),
            reason: reason.trim(),
            expectedUpdatedAt: selected.updatedAt,
          }),
        },
      );
      await parseResponse<Correction>(response);
      await reload();
      setSelected(null);
      setMessage(
        decision === 'MATCH'
          ? 'Die Zuordnung wurde manuell bestätigt und protokolliert.'
          : 'Die Provider-Zuordnung wurde abgelehnt und protokolliert.',
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Die Korrektur konnte nicht gespeichert werden.',
      );
      if (cause instanceof Error && cause.message.includes('inzwischen geändert')) {
        await reload().catch(() => undefined);
        setSelected(null);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || !authenticated || !allowed || !token) return null;

  return (
    <section className={styles.panel} aria-labelledby="sports-corrections-title">
      <h2 id="sports-corrections-title">Sportdaten: Provider-Zuordnungen korrigieren</h2>
      <p className={styles.hint}>
        Nur Administratoren. Fehlerhafte Vereins- oder Spiel-Zuordnungen prüfen, einem vorhandenen
        Datensatz zuweisen oder ausdrücklich ablehnen. Änderungen werden mit Begründung und
        Bearbeiter protokolliert. Offizielle Spiele, Ergebnisse und Tabellen werden nicht verändert.
      </p>

      <div className={styles.toolbar}>
        <label>
          Anzeigen
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'review' | 'all');
              setSelected(null);
            }}
          >
            <option value="review">Offene Problemfälle</option>
            <option value="all">Alle Zuordnungen (auch bereits entschiedene)</option>
          </select>
        </label>
        <span className={styles.meta}>Maximal 50 neueste Einträge · {items.length} angezeigt</span>
      </div>

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
      {loading ? <p role="status">Zuordnungen werden geladen …</p> : null}
      {!loading && items.length === 0 ? (
        <p>Für diese Auswahl liegen derzeit keine Provider-Zuordnungen vor.</p>
      ) : null}

      <ul className={styles.items}>
        {items.map((item) => (
          <li className={styles.item} key={item.id}>
            <strong>
              {item.entityType === 'CLUB' ? 'Verein' : 'Spiel'} ·{' '}
              {item.externalName ?? item.externalId}
            </strong>
            <p className={styles.meta}>
              {item.provider.name} · Status {item.status} · ID {item.externalId}
            </p>
            <p>
              Aktuell:{' '}
              <span className={styles.current}>
                {item.club?.name ??
                  (item.match
                    ? `${item.match.homeClub.name} – ${item.match.awayClub.name}`
                    : 'keine Zuordnung')}
              </span>
            </p>
            <button type="button" onClick={() => choose(item)} disabled={busy}>
              Prüfen / korrigieren
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <form
          className={styles.form}
          aria-label="Sport-Zuordnung manuell korrigieren"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <h3>
            {selected.entityType === 'CLUB' ? 'Vereinszuordnung' : 'Spielzuordnung'} ·{' '}
            {selected.externalName ?? selected.externalId}
          </h3>
          <p className={styles.meta}>
            Quelle: {selected.provider.name} · aktueller Status: {selected.status}
          </p>
          <label>
            Entscheidung
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as 'MATCH' | 'REJECT')}
            >
              <option value="MATCH">Vorhandenem Datensatz zuordnen</option>
              <option value="REJECT">Externe Zuordnung ablehnen</option>
            </select>
          </label>
          {decision === 'MATCH' ? (
            <>
              <label>
                {selected.entityType === 'CLUB' ? 'Verein suchen' : 'Spiel nach Verein suchen'}
                <input
                  value={search}
                  minLength={2}
                  maxLength={100}
                  placeholder={selected.entityType === 'CLUB' ? 'Vereinsname' : 'Heim-/Gastverein'}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={searching || search.trim().length < 2}
                  onClick={() => void findCandidates()}
                >
                  {searching ? 'Suche läuft …' : 'Ziel suchen'}
                </button>
              </div>
              <ul className={styles.candidates}>
                {candidates.map((candidate) => (
                  <li className={styles.candidate} key={candidate.id}>
                    <label>
                      <input
                        type="radio"
                        name="correction-target"
                        value={candidate.id}
                        checked={targetId === candidate.id}
                        onChange={() => setTargetId(candidate.id)}
                      />{' '}
                      {targetLabel(candidate)}
                    </label>
                    <p className={styles.meta}>ID: {candidate.id}</p>
                  </li>
                ))}
              </ul>
              {targetId ? <p className={styles.meta}>Gewähltes Ziel: {targetId}</p> : null}
            </>
          ) : null}
          <label>
            Begründung (mindestens 10 Zeichen)
            <textarea
              required
              minLength={10}
              maxLength={500}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button
              type="submit"
              disabled={busy || reason.trim().length < 10 || (decision === 'MATCH' && !targetId)}
            >
              {busy ? 'Wird protokolliert …' : 'Korrektur speichern'}
            </button>
            <button type="button" disabled={busy} onClick={() => setSelected(null)}>
              Abbrechen
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
