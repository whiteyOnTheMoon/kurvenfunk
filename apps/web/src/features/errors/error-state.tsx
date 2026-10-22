import Link from 'next/link';

import styles from './error-state.module.css';

export type ErrorStatus = 403 | 404 | 429 | 500;

interface ErrorStateProps {
  status: ErrorStatus;
  title: string;
  description: string;
  attribution?: string;
  action?: React.ReactNode;
}

export function ErrorState({ status, title, description, attribution, action }: ErrorStateProps) {
  return (
    <section className={styles.wrapper} aria-labelledby={`error-${status}-title`}>
      <div className={styles.content}>
        <span className={styles.status} aria-hidden="true">
          {status}
        </span>

        <div className={styles.copy}>
          <h1 id={`error-${status}-title`}>{title}</h1>
          {attribution ? <span className={styles.attribution}>— {attribution}</span> : null}
          <p>{description}</p>
        </div>

        <div className={styles.actions}>
          {action ?? (
            <Link href="/" className="kf-button kf-button--emphasis">
              Zur Startseite
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
