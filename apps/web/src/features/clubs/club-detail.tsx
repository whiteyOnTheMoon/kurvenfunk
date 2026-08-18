import Image from 'next/image';
import Link from 'next/link';

import { EmptyState } from '@kurvenfunk/ui';

import { getClubPageMockData } from './club-detail-mock-data';
import styles from './club-detail.module.css';

export interface ClubDetailData {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  color1Hex: string;
  color1Rgba: string;
  color2Hex: string | null;
  color2Rgba: string | null;
  color3Hex: string | null;
  color3Rgba: string | null;
  accentColorHex: string | null;
  accentColorRgba: string | null;
  website: string | null;
  logo: {
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
    mimeType: string;
    source: string | null;
    sourceUrl: string | null;
    copyright: string | null;
  } | null;
}

interface ClubDetailProps {
  club: ClubDetailData;
}

export function ClubDetail({ club }: ClubDetailProps) {
  const clubName = club.shortName ?? club.name;
  const { news, nextMatch, lastMatch, standings, discussions } = getClubPageMockData(club);
  const highlightedStanding = standings.find((row) => row.club.slug === club.slug);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <Image
            src={`/clubs/${club.slug}.svg`}
            alt={`${club.name} Logo`}
            width={120}
            height={120}
            className={styles.logo}
            priority
          />

          <div>
            <span className={styles.eyebrow}>Verein</span>
            <h1>{club.name}</h1>
            <p>News, Spiele, Tabelle und Community rund um {clubName}.</p>
          </div>
        </div>

        {club.website ? (
          <a href={club.website} target="_blank" rel="noreferrer" className={styles.websiteLink}>
            Offizielle Website ↗
          </a>
        ) : null}
      </section>

      <nav className={styles.tabs} aria-label="Vereinsbereiche">
        <a href="#uebersicht">Übersicht</a>
        <a href="#news">News</a>
        <a href="#spiele">Spiele</a>
        <a href="#tabelle">Tabelle</a>
        <a href="#forum">Forum</a>
      </nav>

      <section className={styles.section} id="uebersicht">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Überblick</span>
            <h2>{clubName} auf einen Blick</h2>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          <article className={styles.overviewCard}>
            <span>Nächstes Spiel</span>
            {nextMatch ? (
              <>
                <strong>{nextMatch.date}</strong>
                <p>
                  {nextMatch.home.shortName} – {nextMatch.away.shortName}
                </p>
              </>
            ) : (
              <>
                <strong>–</strong>
                <p>Noch keine Spieldaten verfügbar</p>
              </>
            )}
          </article>

          <article className={styles.overviewCard}>
            <span>Letztes Ergebnis</span>
            {lastMatch ? (
              <>
                <strong>
                  {lastMatch.homeScore}:{lastMatch.awayScore}
                </strong>
                <p>
                  {lastMatch.home.shortName} – {lastMatch.away.shortName}
                </p>
              </>
            ) : (
              <>
                <strong>–</strong>
                <p>Noch keine Spieldaten verfügbar</p>
              </>
            )}
          </article>

          <article className={styles.overviewCard}>
            <span>Tabellenposition</span>
            <strong>{highlightedStanding ? `${highlightedStanding.position}.` : '–'}</strong>
            <p>
              {highlightedStanding
                ? `${highlightedStanding.points} Punkte nach ${highlightedStanding.played} Spielen`
                : 'Noch keine Tabellendaten verfügbar'}
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="news">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Aktuell</span>
            <h2>News</h2>
          </div>

          <Link href={`/news?club=${club.slug}`}>Alle News →</Link>
        </div>

        {news.length > 0 ? (
          <div className={styles.newsGrid}>
            {news.map((article) => (
              <article className={styles.newsCard} key={article.id}>
                <div className={styles.newsMeta}>
                  <span>{article.category}</span>
                  <span>{article.time}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.lead}</p>
                <span className={styles.readMore}>Weiterlesen →</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Keine Vereinsnews">
            <p>Für {clubName} sind derzeit keine News vorhanden.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="spiele">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Bundesliga</span>
            <h2>Spiele</h2>
          </div>
        </div>

        {nextMatch || lastMatch ? (
          <div className={styles.matchesGrid}>
            {[nextMatch, lastMatch]
              .filter((match) => match !== null)
              .map((match) => (
                <article className={styles.matchCard} key={match.id}>
                  <div className={styles.matchMeta}>
                    <span>{match.competition}</span>
                    <span>{match.matchday}</span>
                  </div>

                  <strong className={styles.matchDate}>{match.date}</strong>

                  <div className={styles.team}>
                    <Image src={match.home.logo} alt="" width={32} height={32} />
                    <span>{match.home.shortName}</span>
                    {match.homeScore !== undefined ? <strong>{match.homeScore}</strong> : null}
                  </div>

                  <div className={styles.team}>
                    <Image src={match.away.logo} alt="" width={32} height={32} />
                    <span>{match.away.shortName}</span>
                    {match.awayScore !== undefined ? <strong>{match.awayScore}</strong> : null}
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <EmptyState title="Keine Spiele vorhanden">
            <p>Für {clubName} sind derzeit keine Spieldaten vorhanden.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="tabelle">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Bundesliga</span>
            <h2>Tabelle</h2>
          </div>
        </div>

        {standings.length > 0 ? (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>#</span>
              <span>Verein</span>
              <span>Sp.</span>
              <span>Diff.</span>
              <span>Pkt.</span>
            </div>

            {standings.map((row) => (
              <div
                key={row.club.slug}
                className={`${styles.tableRow} ${
                  row.club.slug === club.slug ? styles.tableRowHighlighted : ''
                }`}
              >
                <span>{row.position}</span>

                <div className={styles.tableClub}>
                  <Image src={row.club.logo} alt="" width={26} height={26} />
                  <span>{row.club.shortName}</span>
                </div>

                <span>{row.played}</span>
                <span>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <strong>{row.points}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Keine Tabellendaten">
            <p>Für diesen Verein sind derzeit keine Tabellendaten verfügbar.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="forum">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Community</span>
            <h2>Forum</h2>
          </div>
        </div>

        {discussions.length > 0 ? (
          <div className={styles.forumList}>
            {discussions.map((discussion) => (
              <article className={styles.forumCard} key={discussion.id}>
                <span>{discussion.context}</span>
                <h3>{discussion.title}</h3>
                <div>
                  <span>{discussion.replies} Antworten</span>
                  <span>{discussion.lastActivity}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Noch keine Diskussionen">
            <p>Für {clubName} gibt es derzeit noch keine Diskussionen.</p>
          </EmptyState>
        )}
      </section>
    </main>
  );
}
