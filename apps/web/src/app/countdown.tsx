'use client';

import { useEffect, useState } from 'react';

import { getLaunchCountdown, type LaunchCountdown } from './countdown-time';
import styles from './page.module.css';

const fields: { key: keyof Pick<LaunchCountdown, 'days' | 'hours' | 'minutes' | 'seconds'>; label: string }[] = [
  { key: 'days', label: 'TAGE' },
  { key: 'hours', label: 'STUNDEN' },
  { key: 'minutes', label: 'MINUTEN' },
  { key: 'seconds', label: 'SEKUNDEN' },
];

export function Countdown() {
  // Kein serverseitiger Zeitpunkt: verhindert Hydration-Fehler und einen
  // falschen Countdown bei gecachter HTML-Antwort.
  const [remaining, setRemaining] = useState<LaunchCountdown | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getLaunchCountdown());
    update();

    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  if (remaining?.finished) {
    return (
      <div className={styles.kickoff} role="status">
        <span className={styles.kickoffDot} aria-hidden="true" />
        ANPFIFF! 2027 IST DA.
      </div>
    );
  }

  return (
    <div
      className={styles.counter}
      role="timer"
      aria-label="Verbleibende Zeit bis 1. Jänner 2027 um 00:00 Uhr mitteleuropäischer Zeit"
    >
      {fields.map(({ key, label }) => (
        <div className={styles.counterUnit} key={key}>
          <span className={styles.counterValue}>
            {remaining === null ? '– –' : String(remaining[key]).padStart(2, '0')}
          </span>
          <span className={styles.counterLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}
