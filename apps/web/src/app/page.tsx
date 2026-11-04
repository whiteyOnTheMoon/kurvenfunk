import { Countdown } from './countdown';
import styles from './page.module.css';

const topics = ['BUNDESLIGA', '2. LIGA', 'ÖFB-CUP', 'NATIONALTEAM', 'FRAUENFUSSBALL'];

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
          <a className={styles.brand} href="/" aria-label="Kurvenfunk Startseite">
            <span className={styles.brandMark} aria-hidden="true">K</span>
            <span>KURVENFUNK<span className={styles.brandStop}>.</span></span>
          </a>
          <span className={styles.headerNote}>
            <span className={styles.statusDot} aria-hidden="true" />
            AB 01.01.2027
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
            Alle News zum österreichischen Fußball.<br className={styles.desktopBreak} />
            Alle Vereine. Alle Geschichten. Eine Leidenschaft.
          </p>
        </section>

        <section className={styles.launch} aria-labelledby="launch-title">
          <div className={styles.launchTopline}>
            <h2 id="launch-title">BIS ZUM ANPFIFF</h2>
            <span className={styles.launchDate}>01 / 01 / 2027</span>
          </div>
          <Countdown />
          <p className={styles.launchCaption}>1. JÄNNER 2027 · 00:00 UHR · WIENER ZEIT</p>
        </section>

        <section className={styles.manifesto} aria-label="Unser Versprechen">
          <span className={styles.quoteMark} aria-hidden="true">“</span>
          <p>Wir machen keine Welle.<br /><strong>Wir machen Fußball.</strong></p>
          <span className={styles.manifestoCaption}>OHNE SHOW. MIT HALTUNG.</span>
        </section>

        <footer className={styles.footer}>
          <div className={styles.topics} aria-label="Unsere Themen">
            {topics.map((topic, index) => (
              <span key={topic}>
                {index > 0 && <span className={styles.topicDivider} aria-hidden="true">/</span>}
                {topic}
              </span>
            ))}
          </div>
          <p>© 2026 KURVENFUNK · MADE FOR THE FANS</p>
        </footer>
      </div>
    </main>
  );
}
