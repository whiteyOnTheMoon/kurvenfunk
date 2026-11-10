/* DEV-only, backup-gated, narrowly fingerprinted cleanup of original Prisma seed rows.
 * Never use on STAGING/PROD. No real-provider import data or comments are deleted.
 */
import { createPrismaClient } from '@kurvenfunk/database';

const seedClubs = JSON.parse(
  '[{"name":"LASK","shortName":"LASK","slug":"lask","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#F02020"},{"name":"SK Sturm Graz","shortName":"Sturm Graz","slug":"sk-sturm-graz","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#43A94D"},{"name":"FC Red Bull Salzburg","shortName":"Salzburg","slug":"fc-red-bull-salzburg","color1Hex":"#E31147","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#FFFFFF"},{"name":"FK Austria Wien","shortName":"Austria Wien","slug":"fk-austria-wien","color1Hex":"#441678","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#441678"},{"name":"SK Rapid Wien","shortName":"Rapid Wien","slug":"sk-rapid-wien","color1Hex":"#00794C","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#E3000F"},{"name":"TSV Hartberg","shortName":"Hartberg","slug":"tsv-hartberg","color1Hex":"#0095DA","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#EE191F"},{"name":"SV Ried","shortName":"Ried","slug":"sv-ried","color1Hex":"#000000","color2Hex":"#007C4F","color3Hex":null,"accentColorHex":"#FFFFFF"},{"name":"Wolfsberger AC","shortName":"WAC","slug":"wolfsberger-ac","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#EB1923"},{"name":"SCR Altach","shortName":"Altach","slug":"scr-altach","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#F7CF00"},{"name":"Grazer AK 1902","shortName":"GAK","slug":"grazer-ak-1902","color1Hex":"#C3171F","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#3862FF"},{"name":"WSG Tirol","shortName":"WSG Tirol","slug":"wsg-tirol","color1Hex":"#0FAB53","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#E21D26"},{"name":"SC Austria Lustenau","shortName":"Austria Lustenau","slug":"sc-austria-lustenau","color1Hex":"#009540","color2Hex":"#FFFFFF","color3Hex":"#000000","accentColorHex":"#DFB800"},{"name":"FC Blau-Weiß Linz","shortName":"Blau-Weiß Linz","slug":"fc-blau-weiss-linz","color1Hex":"#363B92","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#FFFFFF"},{"name":"SKN St. Pölten","shortName":"SKN St. Pölten","slug":"skn-st-poelten","color1Hex":"#085DA4","color2Hex":"#FFED00","color3Hex":null,"accentColorHex":"#E2000B"},{"name":"Admira Wacker","shortName":"Admira","slug":"admira-wacker","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#FF4306"},{"name":"FAC Wien","shortName":"FAC","slug":"fac-wien","color1Hex":"#0062AA","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#0062AA"},{"name":"FC Liefering","shortName":"Liefering","slug":"fc-liefering","color1Hex":"#DC0935","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#1A2143"},{"name":"SKU Amstetten","shortName":"Amstetten","slug":"sku-amstetten","color1Hex":"#2D2E82","color2Hex":"#FFFFFF","color3Hex":"#009639","accentColorHex":"#000000"},{"name":"First Vienna FC 1894","shortName":"First Vienna","slug":"first-vienna-fc-1894","color1Hex":"#315CA3","color2Hex":"#FCE900","color3Hex":null,"accentColorHex":"#000000"},{"name":"Young Violets Austria Wien","shortName":"Young Violets","slug":"young-violets-austria-wien","color1Hex":"#441678","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#441678"},{"name":"SV Austria Salzburg","shortName":"Austria Salzburg","slug":"sv-austria-salzburg","color1Hex":"#452172","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#452172"},{"name":"FC Hertha Wels","shortName":"Hertha Wels","slug":"fc-hertha-wels","color1Hex":"#00A556","color2Hex":"#0968B3","color3Hex":null,"accentColorHex":"#E84941"},{"name":"SK Rapid II","shortName":"Rapid II","slug":"sk-rapid-ii","color1Hex":"#00794C","color2Hex":"#FFFFFF","color3Hex":"#064F81","accentColorHex":"#E3000F"},{"name":"KSV 1919","shortName":"KSV","slug":"ksv-1919","color1Hex":"#E21C2A","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#C9CCCD"},{"name":"SK Sturm Graz II","shortName":"Sturm Graz II","slug":"sk-sturm-graz-ii","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#43A94D"},{"name":"Schwarz-Weiß Bregenz","shortName":"SW Bregenz","slug":"schwarz-weiss-bregenz","color1Hex":"#000000","color2Hex":"#FFFFFF","color3Hex":null,"accentColorHex":"#000000"},{"name":"ASK Voitsberg","shortName":"Voitsberg","slug":"ask-voitsberg","color1Hex":"#FFFFFF","color2Hex":"#000000","color3Hex":null,"accentColorHex":"#000000"},{"name":"FC Wacker Innsbruck","shortName":"Wacker Innsbruck","slug":"fc-wacker-innsbruck","color1Hex":"#008747","color2Hex":"#000000","color3Hex":null,"accentColorHex":"#008747"}]',
);
const seedArticleSlugs = new Set(
  JSON.parse(
    '["seed-bundesliga-2026-27","seed-rapid-derby-vorbereitung","seed-sturm-kader-update","seed-salzburg-neue-impulse","seed-lask-hartberg-vorschau","seed-wac-altach-analyse","seed-ried-saisonstart","seed-2-liga-2026-27","seed-vienna-admira","seed-st-poelten-fac","seed-amstetten-liefering","seed-wacker-austria-salzburg","seed-oefb-cup-2026-27","seed-cup-austria-gak","seed-cup-kapfenberg-bregenz","seed-cup-voitsberg-hertha-wels","seed-rapid-ii-sturm-ii","seed-cup-blau-weiss-rapid"]',
  ),
);
const seedFixtures = JSON.parse(
  '[{"competition":"austrian-bundesliga","home":"lask","away":"grazer-ak-1902","kickoff":"2026-07-31T17:30:00.000Z","stage":"grunddurchgang","matchday":1,"status":"FINISHED","homeScore":2,"awayScore":0},{"competition":"austrian-bundesliga","home":"sk-rapid-wien","away":"fk-austria-wien","kickoff":"2026-08-23T15:00:00.000Z","stage":"grunddurchgang","matchday":4,"status":"SCHEDULED","homeScore":null,"awayScore":null},{"competition":"austrian-bundesliga","home":"sk-sturm-graz","away":"fc-red-bull-salzburg","kickoff":"2026-09-12T15:00:00.000Z","stage":"grunddurchgang","matchday":6,"status":"SCHEDULED","homeScore":null,"awayScore":null},{"competition":"austrian-2-liga","home":"admira-wacker","away":"sk-rapid-ii","kickoff":"2026-07-31T16:30:00.000Z","stage":"grunddurchgang","matchday":1,"status":"FINISHED","homeScore":2,"awayScore":1},{"competition":"austrian-2-liga","home":"young-violets-austria-wien","away":"fc-blau-weiss-linz","kickoff":"2026-07-31T16:30:00.000Z","stage":"grunddurchgang","matchday":1,"status":"FINISHED","homeScore":1,"awayScore":3},{"competition":"austrian-2-liga","home":"first-vienna-fc-1894","away":"sk-sturm-graz-ii","kickoff":"2026-08-01T15:30:00.000Z","stage":"grunddurchgang","matchday":1,"status":"FINISHED","homeScore":4,"awayScore":0},{"competition":"oefb-cup","home":"fc-wacker-innsbruck","away":"sk-rapid-wien","kickoff":"2026-07-25T16:00:00.000Z","stage":"knockout","matchday":1,"status":"FINISHED","homeScore":1,"awayScore":3},{"competition":"oefb-cup","home":"sv-austria-salzburg","away":"sk-sturm-graz","kickoff":"2026-07-25T18:00:00.000Z","stage":"knockout","matchday":1,"status":"FINISHED","homeScore":0,"awayScore":2},{"competition":"oefb-cup","home":"ksv-1919","away":"lask","kickoff":"2026-09-05T16:00:00.000Z","stage":"knockout","matchday":2,"status":"SCHEDULED","homeScore":null,"awayScore":null}]',
);
const seedBody = 'This is deterministic Kurvenfunk development seed content.';
const devFirstSeedFrom = new Date('2026-08-14T03:45:00.000Z');
const devFirstSeedUntil = new Date('2026-08-14T05:00:00.000Z');
const devFinalSeedUpdate = new Date('2026-08-18T00:00:00.000Z');
const editorialMismatchSlug = 'sturm-dreht-verrucktes-topspiel-gegen-rapid';
const mismatchedFixtureKey =
  'austrian-bundesliga|sk-sturm-graz|fc-red-bull-salzburg|2026-09-12T15:00:00.000Z';

export function fixtureKey(row) {
  return [
    row.competition.slug,
    row.homeClub.slug,
    row.awayClub.slug,
    row.kickoff.toISOString(),
  ].join('|');
}

export function isOriginalSeedMatch(row) {
  const expected = seedFixtures.find((candidate) => {
    return (
      [candidate.competition, candidate.home, candidate.away, candidate.kickoff].join('|') ===
      fixtureKey(row)
    );
  });
  return Boolean(
    expected &&
    row.matchday === expected.matchday &&
    row.status === expected.status &&
    row.homeScore === expected.homeScore &&
    row.awayScore === expected.awayScore &&
    row.stage?.slug === expected.stage &&
    row.createdAt >= devFirstSeedFrom &&
    row.createdAt <= devFirstSeedUntil &&
    row.updatedAt <= devFinalSeedUpdate,
  );
}

export function isOriginalSeedArticle(article) {
  const content = article.content;
  return Boolean(
    seedArticleSlugs.has(article.slug) &&
    article.importRecordId === null &&
    article.author?.keycloakSubject === 'seed-editor-user' &&
      content?.type === 'doc' &&
      content?.content?.length === 1 &&
    content.content[0]?.type === 'paragraph' &&
    content.content[0]?.content?.length === 1 &&
    content.content[0].content[0]?.type === 'text' &&
    content.content[0].content[0]?.text === seedBody,
  );
}

export function isOriginalSeedClub(club) {
  const expected = seedClubs.find((candidate) => candidate.slug === club.slug);
  return Boolean(
    expected &&
    club.name === expected.name &&
    club.shortName === expected.shortName &&
    club.color1Hex === expected.color1Hex &&
    club.color2Hex === expected.color2Hex &&
    club.color3Hex === expected.color3Hex &&
    club.accentColorHex === expected.accentColorHex &&
    club.logoMediaId === null &&
    club.website === null &&
    club.active === true &&
    club.createdAt >= devFirstSeedFrom &&
    club.createdAt <= devFirstSeedUntil &&
    club.updatedAt <= devFinalSeedUpdate,
  );
}

const mode = process.env.PHASE21_CLEANUP_MODE ?? 'plan';
if (!['plan', 'apply'].includes(mode)) throw new Error('INVALID_PHASE21_CLEANUP_MODE');
if (process.env.PHASE21_CLEANUP_TARGET !== 'DEV') {
  throw new Error('PHASE21_DEV_TARGET_REQUIRED');
}
if (
  process.env.SPORTS_FAKE_PROVIDER_ENABLED !== 'false' ||
  process.env.SPORTS_IMPORT_SCHEDULER_ENABLED !== 'false' ||
  process.env.SPORTS_IMPORT_LIVE_ENABLED !== 'false'
) {
  throw new Error('SYNTHETIC_SPORT_PRODUCERS_MUST_BE_DISABLED');
}
if (mode === 'apply' && process.env.PHASE21_VERIFIED_BACKUP !== 'YES') {
  throw new Error('VERIFIED_BACKUP_REQUIRED_BEFORE_DELETE');
}

const db = createPrismaClient();
const selects = {
  article: {
    id: true,
    slug: true,
    status: true,
    content: true,
    importRecordId: true,
    author: { select: { keycloakSubject: true } },
    _count: { select: { comments: true, revisions: true, entityMatches: true } },
  },
  match: {
    id: true,
    kickoff: true,
    matchday: true,
    status: true,
    homeScore: true,
    awayScore: true,
    createdAt: true,
    updatedAt: true,
    competition: { select: { slug: true } },
    stage: { select: { slug: true } },
    homeClub: { select: { slug: true } },
    awayClub: { select: { slug: true } },
    articles: { select: { id: true, slug: true } },
    entityMatches: { select: { id: true } },
  },
};

async function cleanup(tx) {
  const [articles, fixtures] = await Promise.all([
    tx.article.findMany({
      where: { slug: { in: [...seedArticleSlugs] } },
      select: selects.article,
    }),
    tx.match.findMany({
      where: {
        season: {
          slug: '2026-27',
          competition: { slug: { in: ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'] } },
        },
      },
      select: selects.match,
    }),
  ]);
  const ownedArticles = articles.filter(isOriginalSeedArticle);
  const removableArticles = ownedArticles.filter(
    (article) =>
    article._count.comments === 0 &&
    article._count.revisions === 0 &&
    article._count.entityMatches === 0,
  );
  const retainedArticles = ownedArticles.filter(
    (article) => !removableArticles.some((candidate) => candidate.id === article.id),
  );
  const ownedIds = new Set(ownedArticles.map((article) => article.id));
  const originalFixtures = fixtures.filter(isOriginalSeedMatch);
  const matchPlan = originalFixtures.map((match) => {
    const linked = match.articles;
    const authorizedLinks = linked.every(
      (article) =>
        ownedIds.has(article.id) ||
        (fixtureKey(match) === mismatchedFixtureKey && article.slug === editorialMismatchSlug),
    );
    return {
      match,
      safe: match.entityMatches.length === 0 && authorizedLinks,
      links: linked.map((a) => a.slug),
    };
  });
  const result = {
    mode,
    originalSeedArticleCandidates: articles.length,
    confirmedGeneratedSeedArticles: ownedArticles.length,
    safeArticleDeletes: removableArticles.length,
    protectedSeedArticlesToArchive: retainedArticles.length,
    originalSeedFixtureCandidates: originalFixtures.length,
    safeFixtureDeletes: matchPlan.filter((row) => row.safe).length,
    blockedFixtures: matchPlan.filter((row) => !row.safe).map((row) => fixtureKey(row.match)),
    unrecognizedSeedArticles: articles.filter((a) => !ownedIds.has(a.id)).map((a) => a.slug),
    deletedArticles: 0,
    archivedArticles: 0,
    detachedMismatchedArticleLinks: 0,
    deletedFixtures: 0,
    deletedUnreferencedSeedClubs: 0,
    protectedOrModifiedSeedClubs: 0,
  };

  if (mode === 'apply') {
    for (const article of removableArticles) {
      const removed = await tx.article.deleteMany({
        where: {
          id: article.id,
          slug: article.slug,
          importRecordId: null,
          comments: { none: {} },
          revisions: { none: {} },
          entityMatches: { none: {} },
        },
      });
      if (removed.count !== 1) throw new Error('SEED_ARTICLE_CONCURRENT_CHANGE');
      result.deletedArticles += removed.count;
    }
    for (const article of retainedArticles) {
      const archived = await tx.article.updateMany({
        where: { id: article.id, slug: article.slug, importRecordId: null },
        data: { status: 'ARCHIVED', archivedAt: new Date(), isTopNews: false },
      });
      if (archived.count !== 1) throw new Error('SEED_ARTICLE_ARCHIVE_CONFLICT');
      result.archivedArticles += archived.count;
    }
    for (const { match, safe } of matchPlan) {
      if (!safe) continue;
      // The Sturm/Rapid editorial article was incorrectly linked to a
      // manufactured Sturm/Salzburg fixture. Preserve the article and revisions.
      if (fixtureKey(match) === mismatchedFixtureKey) {
        const unlinked = await tx.article.updateMany({
          where: { matchId: match.id, slug: editorialMismatchSlug },
          data: { matchId: null },
        });
        result.detachedMismatchedArticleLinks += unlinked.count;
      }
      const survivingSeedArticleIds = ownedArticles
        .filter((article) => !removableArticles.some((removed) => removed.id === article.id))
        .map((article) => article.id);
      await tx.article.updateMany({
        where: { matchId: match.id, id: { in: survivingSeedArticleIds }, status: 'ARCHIVED' },
        data: { matchId: null },
      });
      const deleted = await tx.match.deleteMany({
        where: {
          id: match.id,
          updatedAt: match.updatedAt,
          status: match.status,
          matchday: match.matchday,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          articles: { none: {} },
          entityMatches: { none: {} },
        },
      });
      if (deleted.count !== 1) throw new Error('SEED_MATCH_CONCURRENT_CHANGE');
      result.deletedFixtures += deleted.count;
    }
    // Retain real club identities if any editorial, user or provider relation
    // remains. Only untouched, demonstrably seed-born and fully unreferenced
    // identities may be deleted, with their aliases.
    const candidates = await tx.club.findMany({
      where: { slug: { in: seedClubs.map((club) => club.slug) } },
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        active: true,
        color1Hex: true,
        color2Hex: true,
        color3Hex: true,
        accentColorHex: true,
        logoMediaId: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            articles: true,
            homeMatches: true,
            awayMatches: true,
            standings: true,
            favoriteUsers: true,
            forums: true,
            entityMatches: true,
          },
        },
      },
    });
    for (const club of candidates) {
      const references = Object.values(club._count).reduce((sum, count) => sum + count, 0);
      if (!isOriginalSeedClub(club) || references !== 0) {
        result.protectedOrModifiedSeedClubs += 1;
        continue;
      }
      await tx.clubAlias.deleteMany({ where: { clubId: club.id } });
      const deleted = await tx.club.deleteMany({
        where: {
          id: club.id,
          homeMatches: { none: {} },
          awayMatches: { none: {} },
          standings: { none: {} },
          articles: { none: {} },
          favoriteUsers: { none: {} },
          forums: { none: {} },
          entityMatches: { none: {} },
          aliases: { none: {} },
        },
      });
      if (deleted.count !== 1) throw new Error('SEED_CLUB_CONCURRENT_CHANGE');
      result.deletedUnreferencedSeedClubs += deleted.count;
    }
  }
  return result;
}

try {
  const result = await db.$transaction(cleanup, {
    isolationLevel: 'Serializable',
    maxWait: 10000,
    timeout: 60000,
  });
  console.log('PHASE21_DEV_SEED_CLEANUP_RESULT=' + JSON.stringify(result));
  console.log(
    mode === 'apply' ? 'PHASE21_DEV_SEED_CLEANUP: APPLIED' : 'PHASE21_DEV_SEED_CLEANUP: PLAN_ONLY',
  );
} catch (error) {
  console.error(
    'PHASE21_DEV_SEED_CLEANUP: FAILED',
    error instanceof Error ? error.name : 'UNKNOWN',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
