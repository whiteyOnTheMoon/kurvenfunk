import Image from 'next/image';
import Link from 'next/link';

import { EmptyState } from '@kurvenfunk/ui';

import { getClubLogoSrc, type ClubLogoMedia } from './club-media';
import styles from './club-detail.module.css';

export interface ClubDetailData {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  website: string | null;
  color1Hex: string;
  logo: (ClubLogoMedia & { altText: string | null }) | null;
}

interface ClubMatch {
  id: string;
  kickoff: string;
  matchday: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';
  homeScore: number | null;
  awayScore: number | null;
  competition: { name: string; slug: string };
  season: { name: string };
  homeClub: { name: string; shortName: string | null; slug: string };
  awayClub: { name: string; shortName: string | null; slug: string };
}

export interface ClubOverviewData {
  club: ClubDetailData;
  nextMatch: ClubMatch | null;
  lastMatch: ClubMatch | null;
  matches: ClubMatch[];
  news: {
    id: string;
    slug: string;
    title: string;
    lead: string | null;
    publishedAt: string | null;
    competition: { name: string; shortName: string | null } | null;
  }[];
  standingContext: {
    competition: { name: string; slug: string };
    season: { name: string };
    position: number;
    played: number;
    points: number;
  } | null;
  standings: {
    id: string;
    position: number;
    played: number;
    goalDifference: number;
    points: number;
    club: { id: string; name: string; shortName: string | null; slug: string };
  }[];
  forums: {
    id: string;
    name: string;
    slug: string;
    threads: {
      id: string;
      title: string;
      slug: string;
      postCount: number;
      lastPostAt: string | null;
    }[];
  }[];
}

const matchStatusLabels: Record<ClubMatch['status'], string> = {
  SCHEDULED: 'Geplant',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  ABANDONED: 'Abgebrochen',
};

function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function teamName(team: ClubMatch['homeClub']): string {
  return team.shortName ?? team.name;
}

function formatScore(match: ClubMatch): string | null {
  return match.homeScore !== null && match.awayScore !== null
    ? `${match.homeScore}:${match.awayScore}`
    : null;
}

function ClubLogo({ src, name }: { src: string | null; name: string }) {
  if (!src) {
    return (
      <span className={styles.logoFallback} aria-label={`Kein Logo für ${name} vorhanden`}>
        {name.slice(0, 2).toLocaleUpperCase('de-AT')}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={`${name} Logo`}
      width={120}
      height={120}
      className={styles.logo}
      unoptimized={src.startsWith('http')}
      priority
    />
  );
}

export function ClubDetail({ overview, apiUrl }: { overview: ClubOverviewData; apiUrl: string }) {
  const { club, nextMatch, lastMatch, matches, news, standingContext, standings, forums } =
    overview;
  const clubName = club.shortName ?? club.name;
  const logoSrc = getClubLogoSrc(apiUrl, club);
  const website = club.website && /^https?:\/\//i.test(club.website) ? club.website : null;
  const threads = forums.flatMap((forum) =>
    forum.threads.map((thread) => ({ ...thread, forumName: forum.name })),
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <ClubLogo src={logoSrc} name={club.name} />
          <div>
            <span className={styles.eyebrow}>Verein</span>
            <h1>{club.name}</h1>
            <p>Aktuelle Meldungen, Spiele und Tabellenstände für {clubName}.</p>
          </div>
        </div>
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.websiteLink}
          >
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
                <strong>{formatDate(nextMatch.kickoff, true)}</strong>
                <p>
                  {teamName(nextMatch.homeClub)} – {teamName(nextMatch.awayClub)}
                </p>
                <Link href={`/spiele/${nextMatch.id}`}>Zum Spiel →</Link>
              </>
            ) : (
              <p>Noch kein kommendes Spiel angesetzt.</p>
            )}
          </article>
          <article className={styles.overviewCard}>
            <span>Letztes Ergebnis</span>
            {lastMatch ? (
              <>
                <strong>{formatScore(lastMatch) ?? '–'}</strong>
                <p>
                  {teamName(lastMatch.homeClub)} – {teamName(lastMatch.awayClub)}
                </p>
                <Link href={`/spiele/${lastMatch.id}`}>Zum Spiel →</Link>
              </>
            ) : (
              <p>Noch kein abgeschlossenes Spiel vorhanden.</p>
            )}
          </article>
          <article className={styles.overviewCard}>
            <span>Aktuelle Tabellenposition</span>
            <strong>{standingContext ? `${standingContext.position}.` : '–'}</strong>
            <p>
              {standingContext
                ? `${standingContext.points} Punkte nach ${standingContext.played} Spielen · ${standingContext.competition.name}`
                : 'Noch keine aktuellen Tabellendaten vorhanden.'}
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="news">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Aktuell</span>
            <h2>Vereinsnews</h2>
          </div>
          <Link href={`/news?club=${encodeURIComponent(club.slug)}`}>Alle News →</Link>
        </div>
        {news.length ? (
          <div className={styles.newsGrid}>
            {news.map((article) => (
              <Link href={`/artikel/${article.slug}`} className={styles.newsCard} key={article.id}>
                <div className={styles.newsMeta}>
                  <span>
                    {article.competition?.shortName ?? article.competition?.name ?? clubName}
                  </span>
                  {article.publishedAt ? (
                    <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                  ) : null}
                </div>
                <h3>{article.title}</h3>
                {article.lead ? <p>{article.lead}</p> : null}
                <span className={styles.readMore}>Weiterlesen →</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Keine Vereinsnews">
            <p>Für {clubName} sind derzeit keine veröffentlichten Meldungen verknüpft.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="spiele">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Spielübersicht</span>
            <h2>Spiele & Ergebnisse</h2>
          </div>
          <Link href="/spiele">Alle Spiele →</Link>
        </div>
        {matches.length ? (
          <div className={styles.matchesGrid}>
            {matches.map((match) => (
              <Link href={`/spiele/${match.id}`} className={styles.matchCard} key={match.id}>
                <div className={styles.matchMeta}>
                  <span>
                    {match.competition.name} · {match.season.name}
                  </span>
                  <span>
                    {match.matchday === null
                      ? matchStatusLabels[match.status]
                      : `${match.matchday}. Spieltag`}
                  </span>
                </div>
                <strong className={styles.matchDate}>
                  {formatDate(match.kickoff, true)} · {matchStatusLabels[match.status]}
                </strong>
                <div className={styles.team}>
                  <span>{teamName(match.homeClub)}</span>
                  <strong>{match.homeScore ?? '–'}</strong>
                </div>
                <div className={styles.team}>
                  <span>{teamName(match.awayClub)}</span>
                  <strong>{match.awayScore ?? '–'}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Keine Spiele vorhanden">
            <p>Für {clubName} gibt es derzeit keine aktuellen Spielansetzungen oder Ergebnisse.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="tabelle">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>
              {standingContext?.season.name ?? 'Aktuelle Saison'}
            </span>
            <h2>{standingContext?.competition.name ?? 'Tabelle'}</h2>
          </div>
        </div>
        {standings.length ? (
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
                key={row.id}
                className={`${styles.tableRow} ${row.club.id === club.id ? styles.tableRowHighlighted : ''}`}
              >
                <span>{row.position}</span>
                <Link href={`/vereine/${row.club.slug}`} className={styles.tableClub}>
                  {row.club.shortName ?? row.club.name}
                </Link>
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
            <p>Für {clubName} sind derzeit keine aktiven Tabellenwerte hinterlegt.</p>
          </EmptyState>
        )}
      </section>

      <section className={styles.section} id="forum">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Community</span>
            <h2>Vereinsforum</h2>
          </div>
        </div>
        {threads.length ? (
          <div className={styles.forumList}>
            {threads.map((thread) => (
              <article className={styles.forumCard} key={thread.id}>
                <span>{thread.forumName}</span>
                <h3>{thread.title}</h3>
                <div>
                  <span>{thread.postCount} Beiträge</span>
                  {thread.lastPostAt ? (
                    <time dateTime={thread.lastPostAt}>
                      Letzter Beitrag: {formatDate(thread.lastPostAt, true)}
                    </time>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Keine Diskussionen">
            <p>Für {clubName} sind derzeit keine öffentlichen Vereinsthemen vorhanden.</p>
          </EmptyState>
        )}
      </section>
    </main>
  );
}
