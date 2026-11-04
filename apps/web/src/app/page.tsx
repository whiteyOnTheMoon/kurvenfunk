import Link from 'next/link';

import { Countdown } from './countdown';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.fieldLines} aria-hidden="true">
        <div className={styles.fieldCircle} />
        <div className={styles.fieldArc} />
        <div className={styles.fieldLine} />
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Kurvenfunk Startseite">
            <span className={styles.brandMark} aria-hidden="true">K</span>
            <span>KURVENFUNK<span className={styles.brandStop}>.</span></span>
          </Link>
          <span className={styles.headerNote}>
            <span className={styles.statusDot} aria-hidden="true" />
            COMING SOON
          </span>
        </header>

        <section className={styles.hero} aria-labelledby="hero-title">
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} aria-hidden="true" />
            AUS LIEBE ZUM SPIEL
          </p>
          <h1 id="hero-title" className={styles.headline}>
            ÖSTERREICHS<br />
            <span>FUSSBALL.</span><br />
            DEIN REVIER.
          </h1>
          <p className={styles.description}>
            Alle News zum österreichischen Fußball.<br className={styles.desktopBreak} />{' '}
            Alle Vereine. Alle Geschichten. Eine Leidenschaft.
          </p>
        </section>

        <section className={styles.launch} aria-labelledby="launch-title">
          <div className={styles.launchTopline}>
            <h2 id="launch-title">BIS ZUM ANPFIFF</h2>
          </div>
          <Countdown />
        </section>

        <section className={styles.manifesto} aria-label="Unser Versprechen">
          <span className={styles.quoteMark} aria-hidden="true">“</span>
          <p>Wir machen keine Welle.<br /><strong>Wir machen Fußball.</strong></p>
          <span className={styles.manifestoCaption}>OHNE SHOW. MIT HALTUNG.</span>
        </section>

        <footer className={styles.footer}>
          <p>© 2026 KURVENFUNK · MADE FOR THE FANS</p>
        </footer>
      </div>
    </main>
  );
}
