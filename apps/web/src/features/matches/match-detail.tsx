import Image from 'next/image';
import Link from 'next/link';

import { EmptyState } from '@kurvenfunk/ui';

import styles from './match-detail.module.css';

export interface MatchDetailData {
  id: string;
  kickoff: string;
  matchday: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';
  homeScore: number | null;
  awayScore: number | null;
  homeClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  awayClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  season: {
    id: string;
    name: string;
  };
  stage: {
    id: string;
    name: string;
  } | null;
  news: Array<{
    id: string;
    title: string;
    slug: string;
    lead: string | null;
    publishedAt: string | null;
  }>;
}

const statusLabels: Record<MatchDetailData['status'], string> = {
  SCHEDULED: 'Geplant',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  ABANDONED: 'Abgebrochen',
};

function formatKickoff(value: string) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat('de-AT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Vienna',
    }).format(date),
    time: new Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Vienna',
    }).format(date),
  };
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

export function MatchDetail({ match }: { match: MatchDetailData }) {
  const kickoff = formatKickoff(match.kickoff);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const competitionName = match.competition.shortName ?? match.competition.name;

  return (
    <main className={styles.page}>
      <div className={styles.breadcrumbs}>
        <span>Spiele</span>
        <span aria-hidden="true">/</span>
        <span>{competitionName}</span>
      </div>

      <section className={styles.scoreboard}>
        <div className={styles.matchMeta}>
          <span className={styles.competition}>{match.competition.name}</span>

          <div className={styles.metaItems}>
            {match.matchday !== null ? <span>{match.matchday}. Spieltag</span> : null}
            {match.stage ? <span>{match.stage.name}</span> : null}
            <span>{match.season.name}</span>
          </div>
        </div>

        <div className={styles.teams}>
          <Link href={`/vereine/${match.homeClub.slug}`} className={styles.team}>
            <Image
              src={`/clubs/${match.homeClub.slug}.svg`}
              alt={`${match.homeClub.name} Logo`}
              width={128}
              height={128}
              className={styles.logo}
              priority
            />
            <strong>{match.homeClub.shortName ?? match.homeClub.name}</strong>
          </Link>

          <div className={styles.result}>
            <span className={`${styles.status} ${match.status === 'LIVE' ? styles.live : ''}`}>
              {statusLabels[match.status]}
            </span>

            {hasScore ? (
              <strong className={styles.score}>
                {match.homeScore}:{match.awayScore}
              </strong>
            ) : (
              <strong className={styles.kickoffTime}>{kickoff.time}</strong>
            )}

            <span className={styles.separator}>{hasScore ? 'Endstand' : 'Anstoß'}</span>
          </div>

          <Link href={`/vereine/${match.awayClub.slug}`} className={styles.team}>
            <Image
              src={`/clubs/${match.awayClub.slug}.svg`}
              alt={`${match.awayClub.name} Logo`}
              width={128}
              height={128}
              className={styles.logo}
              priority
            />
            <strong>{match.awayClub.shortName ?? match.awayClub.name}</strong>
          </Link>
        </div>

        <div className={styles.date}>{kickoff.date}</div>
      </section>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Zum Spiel</span>
              <h2>News</h2>
            </div>

            <Link href="/news">Alle News →</Link>
          </div>

          {match.news.length > 0 ? (
            <div className={styles.newsGrid}>
              {match.news.map((article) => {
                const publishedAt = formatPublishedAt(article.publishedAt);

                return (
                  <Link
                    href={`/artikel/${article.slug}`}
                    className={styles.newsCard}
                    key={article.id}
                  >
                    <div className={styles.newsMeta}>
                      <span>{competitionName}</span>
                      {publishedAt ? <span>{publishedAt}</span> : null}
                    </div>

                    <h3>{article.title}</h3>

                    {article.lead ? <p>{article.lead}</p> : null}

                    <span className={styles.readMore}>Weiterlesen →</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Keine News zum Spiel">
              <p>Zu diesem Spiel sind derzeit noch keine News verknüpft.</p>
            </EmptyState>
          )}
        </section>

        <section className={styles.discussion} id="diskussion">
          <div>
            <span className={styles.eyebrow}>Community</span>
            <h2>Diskussion</h2>
            <p>
              Diskutiere mit anderen Fans über {match.homeClub.shortName ?? match.homeClub.name}{' '}
              gegen {match.awayClub.shortName ?? match.awayClub.name}.
            </p>
          </div>

          <div className={styles.discussionPlaceholder}>
            Die Spieldiskussion wird mit dem Community-System freigeschaltet.
          </div>
        </section>
      </div>
    </main>
  );
}
