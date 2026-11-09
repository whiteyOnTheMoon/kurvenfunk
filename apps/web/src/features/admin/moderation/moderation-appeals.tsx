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

interface PendingReview {
  id: string;
  userId: string;
  reason: string;
  proposedDecision: 'ACCEPTED' | 'REJECTED';
  proposedById: string;
  proposedAt: string;
  proposalNote: string;
}

export function ModerationAppeals({ apiUrl }: { apiUrl: string }) {
  const { authenticated, token, user } = useAuth();
  const canDecide =
    user?.status === 'ACTIVE' &&
    (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN'));
  const [items, setItems] = useState<AppealForStaff[]>([]);
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadedToken, setLoadedToken] = useState<string>();
  const [loadedReload, setLoadedReload] = useState<number>();
  const visible = !!token && authenticated && loadedToken === token && loadedReload === reload;
  const shownItems = visible ? items : [];
  const shownPending = visible && canDecide ? pending : [];

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
        const policyResponse = await fetch(`${apiUrl}/api/v1/moderation/appeals/policy`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!policyResponse.ok) throw new Error('Freigaberegel konnte nicht geladen werden.');
        const policy = (await policyResponse.json()) as {
          data?: { appealSecondReviewRequired: boolean };
        };
        if (typeof policy.data?.appealSecondReviewRequired !== 'boolean') {
          throw new Error('Ungültige Freigaberegel.');
        }
        let waiting: PendingReview[] = [];
        if (canDecide) {
          const waitingResponse = await fetch(`${apiUrl}/api/v1/moderation/appeals/pending`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!waitingResponse.ok) throw new Error('Zweitprüfungen konnten nicht geladen werden.');
          const waitingData = (await waitingResponse.json()) as { data?: PendingReview[] };
          if (!Array.isArray(waitingData.data)) throw new Error('Ungültige Zweitprüfungen.');
          waiting = waitingData.data;
        }
        if (active) {
          setItems(data.data);
          setPending(waiting);
          setApprovalRequired(policy.data.appealSecondReviewRequired);
          setNotes({});
          setApprovalNotes({});
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
  }, [apiUrl, authenticated, token, reload, canDecide]);

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
      const result = (await response.json()) as { data?: { status?: string } };
      setReload((x) => x + 1);
      setMessage(
        result.data?.status === 'PENDING_APPROVAL'
          ? 'Der Entscheidungsvorschlag wartet auf eine andere berechtigte Person.'
          : 'Die Einspruchsentscheidung wurde gespeichert und auditiert.',
      );
    } catch {
      setMessage('Entscheidung fehlgeschlagen. Prüfe Berechtigung und aktuellen Fallstatus.');
    } finally {
      setBusyId(undefined);
    }
  }

  async function reviewProposal(appealId: string, outcome: 'APPROVE' | 'RETURN') {
    const decisionNote = (approvalNotes[appealId] ?? '').trim();
    if (!authenticated || !token || !visible || !canDecide || busyId || decisionNote.length < 10)
      return;
    setBusyId(appealId);
    setMessage(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/moderation/appeals/${encodeURIComponent(appealId)}/approval`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ outcome, decisionNote }),
        },
      );
      if (!response.ok) throw new Error('Zweitprüfung fehlgeschlagen.');
      setReload((x) => x + 1);
      setMessage(
        outcome === 'APPROVE'
          ? 'Die zweite Freigabe wurde gespeichert und auditiert.'
          : 'Der Entwurf wurde zur erneuten Prüfung zurückgegeben.',
      );
    } catch {
      setMessage('Zweitprüfung fehlgeschlagen. Prüfe andere Person und aktuellen Fallstatus.');
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
        {approvalRequired
          ? ' Das Vier-Augen-Prinzip für Einsprüche ist aktiv.'
          : ' Die zusätzliche Freigabe ist derzeit nicht verpflichtend.'}
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
                    {approvalRequired ? 'Annahme vorschlagen' : 'Annehmen'}
                  </button>
                  <button
                    type="button"
                    disabled={!!busyId || (notes[appeal.id] ?? '').trim().length < 10}
                    onClick={() => void decide(appeal.id, 'REJECTED')}
                  >
                    {approvalRequired ? 'Ablehnung vorschlagen' : 'Ablehnen'}
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.muted}>Entscheidungen sind ADMIN oder SUPERADMIN vorbehalten.</p>
            )}
          </li>
        ))}
      </ul>
      {canDecide && visible ? (
        <section aria-label="Offene Zweitprüfungen">
          <h3>Freigaben durch eine zweite Person</h3>
          {shownPending.length === 0 ? (
            <p className={styles.muted}>Keine offenen Freigaben.</p>
          ) : null}
          <ul className={styles.list}>
            {shownPending.map((item) => (
              <li key={item.id} className={styles.item}>
                <strong>
                  Vorgeschlagen: {item.proposedDecision === 'ACCEPTED' ? 'Annahme' : 'Ablehnung'}
                </strong>
                <span>Konto: {item.userId}</span>
                <span>Vorgeschlagen: {new Date(item.proposedAt).toLocaleString('de-AT')}</span>
                <p className={styles.reason}>{item.reason}</p>
                <p className={styles.muted}>Interne Begründung: {item.proposalNote}</p>
                {item.proposedById === user?.id || item.userId === user?.id ? (
                  <p className={styles.muted}>
                    Eigenfreigabe ist ausgeschlossen. Eine andere berechtigte Person muss prüfen.
                  </p>
                ) : (
                  <div className={styles.actions}>
                    <label htmlFor={`approval-note-${item.id}`}>
                      Eigene Prüfnotiz (10–2.000 Zeichen)
                    </label>
                    <textarea
                      id={`approval-note-${item.id}`}
                      rows={3}
                      maxLength={2000}
                      value={approvalNotes[item.id] ?? ''}
                      onChange={(event) =>
                        setApprovalNotes((previous) => ({
                          ...previous,
                          [item.id]: event.target.value,
                        }))
                      }
                    />
                    <div className={styles.buttons}>
                      <button
                        type="button"
                        disabled={!!busyId || (approvalNotes[item.id] ?? '').trim().length < 10}
                        onClick={() => void reviewProposal(item.id, 'APPROVE')}
                      >
                        Freigeben
                      </button>
                      <button
                        type="button"
                        disabled={!!busyId || (approvalNotes[item.id] ?? '').trim().length < 10}
                        onClick={() => void reviewProposal(item.id, 'RETURN')}
                      >
                        Zurückgeben
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
