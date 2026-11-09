'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './moderation-appeals.module.css';

interface AppealForStaff {
  id: string;
  userId: string;
  moderationCardId: string | null;
  sanctionId: string | null;
  reason: string;
  status: 'OPEN';
  createdAt: string;
}

export function ModerationAppeals({ apiUrl }: { apiUrl: string }) {
  const { authenticated, token, user } = useAuth();
  const canDecide =
    user?.status === 'ACTIVE' &&
    (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN'));
  const [items, setItems] = useState<AppealForStaff[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadedToken, setLoadedToken] = useState<string>();
  const [loadedReload, setLoadedReload] = useState<number>();
  const visible = !!token && authenticated && loadedToken === token && loadedReload === reload;
  const shownItems = visible ? items : [];

  useEffect(() => {
    // Hide any previous staff member's notes and queue while revalidating.
    if (!authenticated || !token) return;
    let active = true;
    const controller = new AbortController();
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/v1/moderation/appeals`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error('Moderationsberechtigung fehlt oder Dienst nicht verfügbar.');
        const data = (await response.json()) as { data?: AppealForStaff[] };
        if (!Array.isArray(data.data)) throw new Error('Ungültige Antwort des Einspruchsdienstes.');
        if (active) {
          setItems(data.data);
          setNotes({});
          setLoadedToken(token);
          setLoadedReload(reload);
          setMessage(undefined);
        }
      } catch {
        if (active) setMessage('Offene Einsprüche konnten nicht geladen werden.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiUrl, authenticated, token, reload]);

  async function decide(appealId: string, decision: 'ACCEPTED' | 'REJECTED') {
    const decisionNote = (notes[appealId] ?? '').trim();
    if (!authenticated || !token || !visible || !canDecide || busyId || decisionNote.length < 10)
      return;
    setBusyId(appealId);
    setMessage(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/moderation/appeals/${encodeURIComponent(appealId)}/decision`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ decision, decisionNote }),
        },
      );
      if (!response.ok) throw new Error('Die Einspruchsentscheidung wurde nicht gespeichert.');
      setReload((x) => x + 1);
      setMessage('Die Einspruchsentscheidung wurde gespeichert und auditiert.');
    } catch {
      setMessage('Entscheidung fehlgeschlagen. Prüfe Berechtigung und aktuellen Fallstatus.');
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div className={styles.root}>
      <h2>Offene Einsprüche</h2>
      <p className={styles.muted}>
        Moderatoren können Fälle prüfen. Annahme oder Ablehnung erfordert ADMIN oder SUPERADMIN.
        Kritische Netzwerkmaßnahmen werden hier nicht aufgehoben.
      </p>
      {loading ? <p role="status">Einsprüche werden geladen …</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {!loading && visible && shownItems.length === 0 && !message ? (
        <p>Keine offenen Einsprüche.</p>
      ) : null}
      <ul className={styles.list}>
        {shownItems.map((appeal) => (
          <li key={appeal.id} className={styles.item}>
            <strong>{appeal.moderationCardId ? 'Karten-Einspruch' : 'Sanktions-Einspruch'}</strong>
            <span>Konto: {appeal.userId}</span>
            <span>Eingereicht: {new Date(appeal.createdAt).toLocaleString('de-AT')}</span>
            <p className={styles.reason}>{appeal.reason}</p>
            {canDecide ? (
              <div className={styles.actions}>
                <label htmlFor={`appeal-note-${appeal.id}`}>
                  Interne Entscheidungsbegründung (10–2.000 Zeichen)
                </label>
                <textarea
                  id={`appeal-note-${appeal.id}`}
                  rows={3}
                  maxLength={2000}
                  value={notes[appeal.id] ?? ''}
                  onChange={(event) =>
                    setNotes((previous) => ({ ...previous, [appeal.id]: event.target.value }))
                  }
                />
                <div className={styles.buttons}>
                  <button
                    type="button"
                    disabled={!!busyId || (notes[appeal.id] ?? '').trim().length < 10}
                    onClick={() => void decide(appeal.id, 'ACCEPTED')}
                  >
                    Annehmen
                  </button>
                  <button
                    type="button"
                    disabled={!!busyId || (notes[appeal.id] ?? '').trim().length < 10}
                    onClick={() => void decide(appeal.id, 'REJECTED')}
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.muted}>Entscheidungen sind ADMIN oder SUPERADMIN vorbehalten.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
