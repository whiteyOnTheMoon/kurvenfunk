'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../../features/auth/auth-provider';
import styles from './appeals.module.css';

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
interface MyAppeal {
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
    if (response.status === 409)
      throw new Error('Für diese Maßnahme wurde bereits ein Einspruch eingereicht.');
    if (response.status === 401)
      throw new Error('Die Sitzung ist abgelaufen. Bitte melde dich erneut an.');
    if (response.status === 404)
      throw new Error('Diese Maßnahme ist für dein Konto nicht verfügbar.');
    throw new Error('Die Anfrage konnte nicht abgeschlossen werden.');
  }
  const payload = (await response.json()) as { data?: T };
  if (payload.data === undefined) throw new Error('Ungültige Antwort des Einspruchssystems.');
  return payload.data;
}

/**
 * Appeals are the only authenticated BANNED-user UI. This component never
 * sets regular authenticated=true or passes appealToken to other endpoints.
 */
export function AppealsClient({ apiUrl }: { apiUrl: string }) {
  const {
    initialized,
    authenticated,
    token,
    appealToken,
    error: authError,
    loginForAppeals,
  } = useAuth();
  const bearer = authenticated ? token : authError === 'ACCOUNT_BANNED' ? appealToken : undefined;
  const [cards, setCards] = useState<EligibleCard[]>([]);
  const [sanctions, setSanctions] = useState<EligibleSanction[]>([]);
  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [reload, setReload] = useState(0);
  const [loadedBearer, setLoadedBearer] = useState<string>();
  const [loadedReload, setLoadedReload] = useState<number>();
  const visible = !!bearer && loadedBearer === bearer && loadedReload === reload;
  const visibleCards = visible ? cards : [];
  const visibleSanctions = visible ? sanctions : [];
  const visibleAppeals = visible ? appeals : [];

  useEffect(() => {
    // Render only data loaded for the *current* bearer and request generation.
    // No synchronous setState in the effect and no stale-account UI flash.
    if (!initialized || !bearer) return;
    let active = true;
    const controller = new AbortController();
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      try {
        const [eligible, mine] = await Promise.all([
          apiData<{ cards: EligibleCard[]; sanctions: EligibleSanction[] }>(
            `${apiUrl}/api/v1/appeals/eligible`,
            bearer,
            { signal: controller.signal },
          ),
          apiData<MyAppeal[]>(`${apiUrl}/api/v1/appeals/mine`, bearer, {
            signal: controller.signal,
          }),
        ]);
        if (active) {
          setCards(eligible.cards);
          setSanctions(eligible.sanctions);
          setAppeals(mine);
          setSelected('');
          setLoadedBearer(bearer);
          setLoadedReload(reload);
          setNotice(undefined);
        }
      } catch {
        if (active) setNotice('Die Einsprüche konnten nicht geladen werden.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [apiUrl, bearer, initialized, reload]);

  async function submit() {
    if (
      !bearer ||
      !visible ||
      busy ||
      reason.trim().length < 10 ||
      reason.trim().length > 2000 ||
      !selected
    ) {
      return;
    }
    const [kind, id] = selected.split(':', 2);
    if (!id || (kind !== 'card' && kind !== 'sanction')) return;
    setBusy(true);
    setNotice(undefined);
    try {
      await apiData<{ id: string }>(`${apiUrl}/api/v1/appeals`, bearer, {
        method: 'POST',
        body: JSON.stringify({
          ...(kind === 'card' ? { moderationCardId: id } : { sanctionId: id }),
          reason: reason.trim(),
        }),
      });
      setReason('');
      setSelected('');
      setReload((x) => x + 1);
      setNotice('Dein Einspruch wurde eingereicht.');
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : 'Der Einspruch konnte nicht eingereicht werden.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!initialized) return <p role="status">Anmeldung wird geprüft …</p>;

  if (!bearer) {
    return (
      <main className={styles.page}>
        <h1>Einsprüche</h1>
        <p>Bitte melde dich an, um eigene Moderationsmaßnahmen anzufechten.</p>
        <p>Auch mit gesperrtem Kurvenfunk-Konto kannst du einen Einspruch einreichen.</p>
        <button className={styles.button} type="button" onClick={() => void loginForAppeals()}>
          Für Einsprüche anmelden
        </button>
        <p>
          <Link href="/">Zur Startseite</Link>
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Persönlicher, geschützter Bereich</p>
        <h1>Meine Einsprüche</h1>
        <p>
          Hier kannst du Karten oder Sanktionen deines eigenen Kontos anfechten und den
          Bearbeitungsstand prüfen.
        </p>
        {authError === 'ACCOUNT_BANNED' ? (
          <p className={styles.notice}>
            Dein Konto ist gesperrt. Diese Anmeldung erlaubt ausschließlich Einsprüche, keinen
            Zugang zu Community- oder Moderationsfunktionen.
          </p>
        ) : null}
      </header>

      {loading ? <p role="status">Deine Maßnahmen und Einsprüche werden geladen …</p> : null}
      {notice ? <p role="status">{notice}</p> : null}

      <section className={styles.panel} aria-labelledby="new-appeal">
        <h2 id="new-appeal">Einspruch einreichen</h2>
        <label htmlFor="appeal-target">Betroffene Karte oder Sanktion</label>
        <select
          id="appeal-target"
          value={visible ? selected : ''}
          onChange={(event) => setSelected(event.target.value)}
          disabled={busy || loading}
        >
          <option value="">Bitte auswählen</option>
          {visibleCards.map((card) => (
            <option key={card.id} value={`card:${card.id}`}>
              Karte {card.type} – {card.reasonCode} ({card.status})
            </option>
          ))}
          {visibleSanctions.map((sanction) => (
            <option key={sanction.id} value={`sanction:${sanction.id}`}>
              {sanction.type} – {sanction.reasonCode} ({sanction.status})
            </option>
          ))}
        </select>
        <label htmlFor="appeal-reason">Begründung (10 bis 2.000 Zeichen)</label>
        <textarea
          id="appeal-reason"
          rows={5}
          value={reason}
          maxLength={2000}
          onChange={(event) => setReason(event.target.value)}
          disabled={busy}
        />
        <button
          type="button"
          className={styles.button}
          disabled={busy || loading || !visible || !selected || reason.trim().length < 10}
          onClick={() => void submit()}
        >
          {busy ? 'Wird eingereicht …' : 'Einspruch senden'}
        </button>
        <p className={styles.muted}>
          Pro Karte oder Sanktion ist ein Einspruch möglich. IP-Netzwerksperren werden gesondert
          geprüft.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="my-appeals">
        <h2 id="my-appeals">Bisherige Einsprüche</h2>
        {visibleAppeals.length === 0 && !loading && visible ? (
          <p>Du hast noch keine Einsprüche eingereicht.</p>
        ) : null}
        <ul className={styles.list}>
          {visibleAppeals.map((appeal) => (
            <li key={appeal.id}>
              <strong>
                {appeal.status === 'OPEN'
                  ? 'In Prüfung'
                  : appeal.status === 'ACCEPTED'
                    ? 'Angenommen'
                    : 'Abgelehnt'}
              </strong>
              <time dateTime={appeal.createdAt}>
                {new Date(appeal.createdAt).toLocaleDateString('de-AT')}
              </time>
              <p>{appeal.reason}</p>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/">Zur Startseite</Link>
    </main>
  );
}
