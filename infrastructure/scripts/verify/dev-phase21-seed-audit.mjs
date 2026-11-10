// Read-only inventory; run from the DEV worker container where Prisma is installed.
import { createPrismaClient } from '@kurvenfunk/database';

const db = createPrismaClient();
const competitionSlugs = ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'];
const seedClubSlugs = [
  'lask',
  'sk-sturm-graz',
  'fc-red-bull-salzburg',
  'fk-austria-wien',
  'sk-rapid-wien',
  'tsv-hartberg',
  'sv-ried',
  'wolfsberger-ac',
  'scr-altach',
  'grazer-ak-1902',
  'wsg-tirol',
  'sc-austria-lustenau',
  'fc-blau-weiss-linz',
  'skn-st-poelten',
  'admira-wacker',
  'fac-wien',
  'fc-liefering',
  'sku-amstetten',
  'first-vienna-fc-1894',
  'young-violets-austria-wien',
  'sv-austria-salzburg',
  'fc-hertha-wels',
  'sk-rapid-ii',
  'ksv-1919',
  'sk-sturm-graz-ii',
  'schwarz-weiss-bregenz',
  'ask-voitsberg',
  'fc-wacker-innsbruck',
];
const seedFixtureKeys = new Set([
  'austrian-bundesliga|lask|grazer-ak-1902|2026-07-31T17:30:00.000Z',
  'austrian-bundesliga|sk-rapid-wien|fk-austria-wien|2026-08-23T15:00:00.000Z',
  'austrian-bundesliga|sk-sturm-graz|fc-red-bull-salzburg|2026-09-12T15:00:00.000Z',
  'austrian-2-liga|admira-wacker|sk-rapid-ii|2026-07-31T16:30:00.000Z',
  'austrian-2-liga|young-violets-austria-wien|fc-blau-weiss-linz|2026-07-31T16:30:00.000Z',
  'austrian-2-liga|first-vienna-fc-1894|sk-sturm-graz-ii|2026-08-01T15:30:00.000Z',
  'oefb-cup|fc-wacker-innsbruck|sk-rapid-wien|2026-07-25T16:00:00.000Z',
  'oefb-cup|sv-austria-salzburg|sk-sturm-graz|2026-07-25T18:00:00.000Z',
  'oefb-cup|ksv-1919|lask|2026-09-05T16:00:00.000Z',
]);

function fixtureKey(row) {
  return [
    row.competition.slug,
    row.homeClub.slug,
    row.awayClub.slug,
    row.kickoff.toISOString(),
  ].join('|');
}

try {
  const [clubs, matches, standings, seededArticles, seededUsers, sportsProviders] =
    await Promise.all([
      db.club.findMany({
        where: { slug: { in: seedClubSlugs } },
        select: {
          id: true,
          slug: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              aliases: true,
              homeMatches: true,
              awayMatches: true,
              standings: true,
              articles: true,
              favoriteUsers: true,
              forums: true,
              entityMatches: true,
            },
          },
        },
      }),
      db.match.findMany({
        where: { season: { slug: '2026-27', competition: { slug: { in: competitionSlugs } } } },
        select: {
          id: true,
          kickoff: true,
          matchday: true,
          status: true,
          homeScore: true,
          awayScore: true,
          createdAt: true,
          updatedAt: true,
          stage: { select: { slug: true } },
          competition: { select: { slug: true } },
          homeClub: { select: { slug: true } },
          awayClub: { select: { slug: true } },
          _count: { select: { articles: true, entityMatches: true } },
        },
      }),
      db.standing.findMany({
        where: { season: { slug: '2026-27', competition: { slug: { in: competitionSlugs } } } },
        select: { id: true, competition: { select: { slug: true } }, stageId: true },
      }),
      db.article.findMany({
        where: { slug: { startsWith: 'seed-' } },
        select: {
          id: true,
          slug: true,
          status: true,
          matchId: true,
          importRecordId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { comments: true, revisions: true, entityMatches: true } },
        },
      }),
      db.user.findMany({
        where: {
          keycloakSubject: { in: ['seed-neutral-user', 'seed-rapid-user', 'seed-editor-user'] },
        },
        select: {
          id: true,
          keycloakSubject: true,
          _count: { select: { articles: true, comments: true, forumPosts: true } },
        },
      }),
      db.provider.findMany({
        where: { key: 'fake-sports' },
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              importJobs: true,
              importRecords: true,
              rawPayloads: true,
              entityMatches: true,
            },
          },
        },
      }),
    ]);
  const fixtureMatches = matches.filter((row) => seedFixtureKeys.has(fixtureKey(row)));
  const linkedArticles = await db.article.findMany({
    where: { matchId: { in: fixtureMatches.map((row) => row.id) } },
    select: {
      matchId: true,
      slug: true,
      status: true,
      _count: { select: { comments: true, revisions: true, entityMatches: true } },
    },
  });
  const linkedEntityMatches = await db.entityMatch.findMany({
    where: { matchId: { in: fixtureMatches.map((row) => row.id) } },
    select: { matchId: true, status: true, provider: { select: { key: true } } },
  });
  const otherMatches = matches.filter((row) => !seedFixtureKeys.has(fixtureKey(row)));
  const modifiedFixtureCandidates = fixtureMatches.filter(
    (row) => row._count.articles !== 0 || row._count.entityMatches !== 0,
  );
  const clubReferences = clubs.filter(
    (club) =>
      club._count.homeMatches +
        club._count.awayMatches +
        club._count.standings +
        club._count.articles +
        club._count.favoriteUsers +
        club._count.forums +
        club._count.entityMatches >
      0,
  );
  const summary = {
    seededClubSlugsPresent: clubs.length,
    seededClubsWithReferences: clubReferences.length,
    seededClubAliases: clubs.reduce((n, row) => n + row._count.aliases, 0),
    originalFixtureFingerprintMatches: fixtureMatches.length,
    fixtureCandidatesWithLinkedContent: modifiedFixtureCandidates.length,
    otherFixturesInSameSeasons: otherMatches.length,
    standingsInSeededSeasons: standings.length,
    knownSeedArticles: seededArticles.length,
    seedArticlesWithCommentsOrRevisionsOrMatching: seededArticles.filter(
      (a) => a._count.comments + a._count.revisions + a._count.entityMatches > 0,
    ).length,
    knownSeedUsers: seededUsers.length,
    syntheticSportsProviders: sportsProviders.length,
    syntheticImportJobs: sportsProviders.reduce((n, p) => n + p._count.importJobs, 0),
    syntheticImportRecords: sportsProviders.reduce((n, p) => n + p._count.importRecords, 0),
    syntheticRawPayloads: sportsProviders.reduce((n, p) => n + p._count.rawPayloads, 0),
    syntheticEntityMatches: sportsProviders.reduce((n, p) => n + p._count.entityMatches, 0),
  };
  console.log(JSON.stringify(summary, null, 2));
  // IDs and personal details are intentionally omitted from these diagnostics.
  console.log(
    'DEV seed provenance details (no personal identifiers):',
    JSON.stringify(
      {
        fixtureCandidates: fixtureMatches.map((row) => ({
          fingerprint: fixtureKey(row),
          matchday: row.matchday,
          stage: row.stage?.slug ?? null,
          status: row.status,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          linkedArticleSlugs: linkedArticles
            .filter((article) => article.matchId === row.id)
            .map((article) => ({
              slug: article.slug,
              status: article.status,
              comments: article._count.comments,
              revisions: article._count.revisions,
              entityMatches: article._count.entityMatches,
            })),
          linkedProviderMatches: linkedEntityMatches
            .filter((match) => match.matchId === row.id)
            .map((match) => ({ providerKey: match.provider.key, status: match.status })),
        })),
        seedArticles: seededArticles.map((article) => ({
          slug: article.slug,
          status: article.status,
          linkedMatch: article.matchId !== null,
          imported: article.importRecordId !== null,
          modifiedAfterCreation: article.updatedAt > article.createdAt,
          comments: article._count.comments,
          revisions: article._count.revisions,
          entityMatches: article._count.entityMatches,
        })),
        clubDependencies: clubs.map((club) => ({
          slug: club.slug,
          modifiedAfterCreation: club.updatedAt > club.createdAt,
          ...club._count,
        })),
      },
      null,
      2,
    ),
  );
  console.log('DEV read-only provenance audit: PASS');
  console.log(
    'Nothing deleted. Original clubs/standings cannot be considered synthetic without further provenance.',
  );
} catch (error) {
  console.error(
    'DEV read-only provenance audit: FAILED',
    error instanceof Error ? error.name : 'UnknownError',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
