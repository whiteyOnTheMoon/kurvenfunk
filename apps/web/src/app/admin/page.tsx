import styles from './page.module.css';

const dashboardItems = [
  {
    title: 'Artikel',
    value: '–',
    description: 'Redaktionelle Inhalte',
  },
  {
    title: 'Importe',
    value: '–',
    description: 'News- und Datenimporte',
  },
  {
    title: 'Benutzer',
    value: '–',
    description: 'Registrierte Accounts',
  },
  {
    title: 'Reports',
    value: '–',
    description: 'Offene Moderationsfälle',
  },
];

export default function AdminPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Übersicht</p>
          <h1>Dashboard</h1>
          <p className={styles.intro}>
            Zentrale Verwaltung für Inhalte, Sportdaten, Community und System.
          </p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Admin Übersicht">
        {dashboardItems.map((item) => (
          <article key={item.title} className={styles.statCard}>
            <span className={styles.statLabel}>{item.title}</span>
            <strong className={styles.statValue}>{item.value}</strong>
            <span className={styles.statDescription}>{item.description}</span>
          </article>
        ))}
      </section>

      <section className={styles.placeholder}>
        <div>
          <p className={styles.eyebrow}>Task 127</p>
          <h2>Admin-Grundgerüst</h2>
        </div>

        <p>
          Die fachlichen Admin-Funktionen werden in den folgenden Tasks ergänzt. Dieses Layout
          bildet die gemeinsame Grundlage für alle Verwaltungsbereiche.
        </p>
      </section>
    </div>
  );
}
