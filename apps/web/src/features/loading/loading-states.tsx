import { Skeleton } from '@kurvenfunk/ui';

import styles from './loading-states.module.css';

export function PageHeaderSkeleton() {
  return (
    <div className={styles.pageHeader} aria-hidden="true">
      <div>
        <Skeleton className={styles.eyebrow} />
        <Skeleton className={styles.title} />
        <Skeleton className={styles.subtitle} />
      </div>
      <Skeleton className={styles.headerMeta} />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.cardGrid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.card} key={index}>
          <div className={styles.cardMeta}>
            <Skeleton />
            <Skeleton />
          </div>
          <Skeleton className={styles.cardTitle} />
          <Skeleton className={styles.cardText} />
          <Skeleton className={styles.cardTextShort} />
        </div>
      ))}
    </div>
  );
}

export function StartpageLoadingState() {
  return (
    <main className={styles.startpage} aria-busy="true" aria-label="Startseite wird geladen">
      <section className={styles.startpageHero}>
        <div className={styles.heroText}>
          <Skeleton className={styles.eyebrow} />
          <Skeleton className={styles.startpageTitle} />
          <Skeleton className={styles.startpageLead} />
          <Skeleton className={styles.startpageLeadShort} />
        </div>

        <Skeleton className={styles.startpageLogo} />
      </section>

      <section className={styles.startpageSection}>
        <Skeleton className={styles.sectionTitle} />
        <CardGridSkeleton count={3} />
      </section>

      <section className={styles.startpageSection}>
        <Skeleton className={styles.sectionTitle} />
        <div className={styles.startpageOverview}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </section>

      <section className={styles.startpageSection}>
        <Skeleton className={styles.sectionTitle} />
        <CardGridSkeleton count={3} />
      </section>
    </main>
  );
}

export function ArticleLoadingState() {
  return (
    <main className={styles.articlePage} aria-busy="true" aria-label="Artikel wird geladen">
      <Skeleton className={styles.breadcrumb} />

      <header className={styles.articleHeader}>
        <Skeleton className={styles.eyebrow} />
        <Skeleton className={styles.articleTitle} />
        <Skeleton className={styles.articleTitleShort} />
        <Skeleton className={styles.articleLead} />
        <Skeleton className={styles.articleLeadShort} />

        <div className={styles.articleMeta}>
          <Skeleton />
          <Skeleton />
        </div>
      </header>

      <Skeleton className={styles.articleMedia} />

      <div className={styles.articleLayout}>
        <div>
          <div className={styles.articleBody}>
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton
                className={index === 2 || index === 6 ? styles.bodyLineShort : styles.bodyLine}
                key={index}
              />
            ))}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <Skeleton className={styles.sidebarCard} />
          <Skeleton className={styles.sidebarCardSmall} />
        </aside>
      </div>
    </main>
  );
}

export function DetailLoadingState({ kind }: { kind: 'club' | 'match' }) {
  return (
    <main className={styles.detailPage} aria-busy="true" aria-label="Inhalt wird geladen">
      <section className={kind === 'club' ? styles.clubHero : styles.matchHero}>
        {kind === 'club' ? (
          <>
            <Skeleton className={styles.clubLogo} />
            <div className={styles.heroText}>
              <Skeleton className={styles.eyebrow} />
              <Skeleton className={styles.detailTitle} />
              <Skeleton className={styles.detailSubtitle} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.matchTeam}>
              <Skeleton className={styles.matchLogo} />
              <Skeleton className={styles.teamName} />
            </div>

            <div className={styles.matchResult}>
              <Skeleton className={styles.score} />
              <Skeleton className={styles.scoreLabel} />
            </div>

            <div className={styles.matchTeam}>
              <Skeleton className={styles.matchLogo} />
              <Skeleton className={styles.teamName} />
            </div>
          </>
        )}
      </section>

      <section className={styles.detailSection}>
        <PageHeaderSkeleton />
        <CardGridSkeleton count={3} />
      </section>

      <section className={styles.detailSection}>
        <Skeleton className={styles.sectionTitle} />
        <CardGridSkeleton count={3} />
      </section>
    </main>
  );
}

export function ListPageLoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <main className={styles.listPage} aria-busy="true" aria-label="Inhalte werden geladen">
      <PageHeaderSkeleton />

      <Skeleton className={styles.tabs} />

      <section className={styles.listSection}>
        <div className={styles.listSectionHeader}>
          <div>
            <Skeleton className={styles.eyebrow} />
            <Skeleton className={styles.sectionTitle} />
          </div>
        </div>

        <div className={styles.rows}>
          {Array.from({ length: rows }, (_, index) => (
            <div className={styles.row} key={index}>
              <Skeleton className={styles.rowLeading} />
              <div className={styles.rowContent}>
                <Skeleton className={styles.rowTitle} />
                <Skeleton className={styles.rowSubtitle} />
              </div>
              <Skeleton className={styles.rowTrailing} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ProfileLoadingState() {
  return (
    <main className={styles.profilePage} aria-busy="true" aria-label="Profil wird geladen">
      <section className={styles.profileHero}>
        <Skeleton className={styles.profileAvatar} />

        <div className={styles.profileIdentity}>
          <Skeleton className={styles.eyebrow} />
          <Skeleton className={styles.profileName} />
          <Skeleton className={styles.profileMeta} />
        </div>

        <Skeleton className={styles.profileAction} />
      </section>

      <div className={styles.profileLayout}>
        <div className={styles.profileMain}>
          <Skeleton className={styles.profileCard} />
          <Skeleton className={styles.profileStatsCard} />
        </div>

        <div className={styles.profileSide}>
          <Skeleton className={styles.profileSideCard} />
          <Skeleton className={styles.profileSideCard} />
        </div>
      </div>
    </main>
  );
}

export function SettingsLoadingState() {
  return (
    <main
      className={styles.settingsPage}
      aria-busy="true"
      aria-label="Einstellungen werden geladen"
    >
      <PageHeaderSkeleton />

      <div className={styles.settingsLayout}>
        <div className={styles.settingsNavigation}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className={styles.settingsNavItem} key={index} />
          ))}
        </div>

        <div className={styles.settingsPanel}>
          <Skeleton className={styles.eyebrow} />
          <Skeleton className={styles.settingsTitle} />
          <Skeleton className={styles.settingsIntro} />

          <div className={styles.settingsFields}>
            <Skeleton />
            <Skeleton />
            <Skeleton className={styles.settingsTextarea} />
          </div>
        </div>
      </div>
    </main>
  );
}
