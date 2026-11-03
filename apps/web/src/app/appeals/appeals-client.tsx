'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../features/auth/auth-provider';

interface EligibleCard {
  id: string;
  type: string;
  status: string;
  reasonCode: string;
  issuedAt: string;
}
interface EligibleSanction {
  id: string;
  type: string;
  status: string;
  reasonCode: string;
  startsAt: string;
  expiresAt: string | null;
}
interface Appeal {
  id: string;
  moderationCardId: string | null;
  sanctionId: string | null;
  reason: string;
  status: 'OPEN' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  resolvedAt: string | null;
}

async function apiData<T>(url: string, bearer: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${bearer}`,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { data?: T };
  if (payload.data === undefined) {
    throw new Error('Ungültige API-Antwort');
  }
  return payload.data;
}

export function AppealsClient({ apiUrl }: { apiUrl: string }) {
  const { token, initialized, error: authError, login } = useAuth();
  const [cards, setCards] = useState<EligibleCard[]>([]);
  const [sanctions, setSanctions] = useState<EligibleSanction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  const load = useCallback(async (bearer: string) => {
    setLoading(true);
    try {
      const [eligible, current] = await Promise.all([
        apiData<{ cards: EligibleCard[]; sanctions: EligibleSanction[] }>(
          `${apiUrl}/api/v1/appeals/eligible`, bearer),
        apiData<Appeal[]>(`${apiUrl}/api/v1/appeals/mine`, bearer),
      ]);
      setCards(eligible.cards);
      setSanctions(eligible.sanctions);
      setAppeals(current);
      setMessage(undefined);
    } catch {
      setMessage('Deine Karten und Einsprüche konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  async function submit() {
    if (!token || busy || reason.trim().length < 10 || !selected) return;
    const [kind, id] = selected.split(':', 2);
    if (!id || !['card', 'sanction'].includes(kind ?? '')) return;
    setBusy(true);
    try {
      await apiData<Appeal>(`${apiUrl}/api/v1/appeals`, token, {
        method: 'POST',
        body: JSON.stringify({
          ...(kind === 'card' ? { moderationCardId: id } : { sanctionId: id }),
          reason: reason.trim(),
        }),
      });
      setSelected('');
      setReason('');
      await load(token);
      setMessage('Dein Einspruch wurde eingereicht.');
    } catch {
      setMessage('Der Einspruch konnte nicht eingereicht werden. Vielleicht existiert er bereits.');
    } finally {
      setBusy(false);
    }
  }

  if (!initialized) return <p>Deine Anmeldung wird geprüft …</p>;

  if (!token) {
    return (
      <main>
        <h1>Meine Einsprüche</h1>
        <p>Bitte melde dich an, um eine eigene Sanktion anzufechten.</p>
        <button type="button" onClick={() => void login()}>Anmelden</button>
        <p><Link href="/login">Zur Anmeldung</Link></p>
      </main>
    );
  }

  return (
    <main>
      <h1>Meine Einsprüche</h1>
      <p>Hier kannst du Entscheidungen über dein Konto anfechten und den Bearbeitungsstand ansehen.</p>
      {authError === 'ACCOUNT_BANNED' && (
        <p>Dein Konto ist gesperrt. Diese Seite ist ausschließlich für deine Einsprüche zugänglich.</p>
      )}
      {loading && <p role="status">Einsprüche werden geladen …</p>}
      {message && <p role="status">{message}</p>}
      <section aria-labelledby="appeal-create">
        <h2 id="appeal-create">Einspruch einreichen</h2>
        <label htmlFor="appeal-target">Betroffene Karte oder Sanktion</label>
        <select id="appeal-target" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Bitte auswählen</option>
          {cards.map((card) => (
            <option key={card.id} value={`card:${card.id}`}>
              {card.type} – {card.reasonCode} ({card.status})
            </option>
          ))}
          {sanctions.map((sanction) => (
            <option key={sanction.id} value={`sanction:${sanction.id}`}>
              {sanction.type} – {sanction.reasonCode} ({sanction.status})
            </option>
          ))}
        </select>
        <label htmlFor="appeal-reason">Begründung (mindestens 10 Zeichen)</label>
        <textarea
          id="appeal-reason"
          value={reason}
          maxLength={2000}
          rows={5}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !selected || reason.trim().length < 10}
          onClick={() => void submit()}
        >
          {busy ? 'Wird eingereicht …' : 'Einspruch senden'}
        </button>
      </section>
      <section aria-labelledby="appeal-history">
        <h2 id="appeal-history">Bisherige Einsprüche</h2>
        {appeals.length === 0 && !loading ? <p>Du hast noch keine Einsprüche eingereicht.</p> : null}
        <ul>
          {appeals.map((appeal) => (
            <li key={appeal.id}>
              <strong>{appeal.status === 'OPEN' ? 'In Prüfung' : appeal.status === 'ACCEPTED' ? 'Angenommen' : 'Abgelehnt'}</strong>
              {' – '}{new Date(appeal.createdAt).toLocaleDateString('de-AT')}
              <p>{appeal.reason}</p>
            </li>
          ))}
        </ul>
      </section>
      <p><Link href="/">Zur Startseite</Link></p>
    </main>
  );
}
