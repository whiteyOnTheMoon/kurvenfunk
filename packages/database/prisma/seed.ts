import { createPrismaClient } from '../src/client.js';

const prisma = createPrismaClient();

const clubs = [
  // ---------------------------------------------------------------------------
  // ADMIRAL Bundesliga 2026/27
  // ---------------------------------------------------------------------------
  {
    name: 'LASK',
    shortName: 'LASK',
    slug: 'lask',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#F02020',
    aliases: ['ASK', 'Linzer ASK', 'LASK Linz'],
  },
  {
    name: 'SK Sturm Graz',
    shortName: 'Sturm Graz',
    slug: 'sk-sturm-graz',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#43A94D',
    aliases: ['STU', 'Sturm', 'Sturm Graz', 'SK Puntigamer Sturm Graz'],
  },
  {
    name: 'FC Red Bull Salzburg',
    shortName: 'Salzburg',
    slug: 'fc-red-bull-salzburg',
    color1Hex: '#E31147',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
    aliases: ['RBS', 'Red Bull Salzburg', 'RB Salzburg', 'Salzburg'],
  },
  {
    name: 'FK Austria Wien',
    shortName: 'Austria Wien',
    slug: 'fk-austria-wien',
    color1Hex: '#441678',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#441678',
    aliases: ['FAK', 'Austria', 'Austria Wien', 'Veilchen'],
  },
  {
    name: 'SK Rapid Wien',
    shortName: 'Rapid Wien',
    slug: 'sk-rapid-wien',
    color1Hex: '#00794C',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#E3000F',
    aliases: ['SCR', 'SK Rapid', 'Rapid', 'Rapid Wien'],
  },
  {
    name: 'TSV Hartberg',
    shortName: 'Hartberg',
    slug: 'tsv-hartberg',
    color1Hex: '#0095DA',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#EE191F',
    aliases: ['HTB', 'Hartberg', 'TSV Egger Glas Hartberg'],
  },
  {
    name: 'SV Ried',
    shortName: 'Ried',
    slug: 'sv-ried',
    color1Hex: '#000000',
    color2Hex: '#007C4F',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
    aliases: ['SVR', 'Ried', 'SV Oberbank Ried'],
  },
  {
    name: 'Wolfsberger AC',
    shortName: 'WAC',
    slug: 'wolfsberger-ac',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#EB1923',
    aliases: ['WAC', 'Wolfsberg', 'RZ Pellets WAC'],
  },
  {
    name: 'SCR Altach',
    shortName: 'Altach',
    slug: 'scr-altach',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#F7CF00',
    aliases: ['ALT', 'Altach', 'Rheindorf Altach'],
  },
  {
    name: 'Grazer AK 1902',
    shortName: 'GAK',
    slug: 'grazer-ak-1902',
    color1Hex: '#C3171F',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#3862FF',
    aliases: ['GAK', 'Grazer AK', 'GAK 1902'],
  },
  {
    name: 'WSG Tirol',
    shortName: 'WSG Tirol',
    slug: 'wsg-tirol',
    color1Hex: '#0FAB53',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#E21D26',
    aliases: ['WSG', 'WSG Wattens', 'Wattens'],
  },
  {
    name: 'SC Austria Lustenau',
    shortName: 'Austria Lustenau',
    slug: 'sc-austria-lustenau',
    color1Hex: '#009540',
    color2Hex: '#FFFFFF',
    color3Hex: '#000000',
    accentColorHex: '#DFB800',
    aliases: ['ALU', 'Austria Lustenau', 'Lustenau'],
  },

  // ---------------------------------------------------------------------------
  // ADMIRAL 2. Liga 2026/27
  // ---------------------------------------------------------------------------
  {
    name: 'FC Blau-Weiß Linz',
    shortName: 'Blau-Weiß Linz',
    slug: 'fc-blau-weiss-linz',
    color1Hex: '#363B92',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
    aliases: ['BWL', 'Blau Weiß Linz', 'Blau-Weiß Linz', 'BW Linz'],
  },
  {
    name: 'SKN St. Pölten',
    shortName: 'SKN St. Pölten',
    slug: 'skn-st-poelten',
    color1Hex: '#085DA4',
    color2Hex: '#FFED00',
    color3Hex: null,
    accentColorHex: '#E2000B',
    aliases: ['SKN', 'St. Pölten', 'SKN St Pölten'],
  },
  {
    name: 'Admira Wacker',
    shortName: 'Admira',
    slug: 'admira-wacker',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FF4306',
    aliases: ['ADM', 'Admira', 'FC Admira Wacker', 'FC Admira'],
  },
  {
    name: 'FAC Wien',
    shortName: 'FAC',
    slug: 'fac-wien',
    color1Hex: '#0062AA',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#0062AA',
    aliases: ['FAC', 'Floridsdorfer AC', 'FAC WIEN'],
  },
  {
    name: 'FC Liefering',
    shortName: 'Liefering',
    slug: 'fc-liefering',
    color1Hex: '#DC0935',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#1A2143',
    aliases: ['FCL', 'Liefering'],
  },
  {
    name: 'SKU Amstetten',
    shortName: 'Amstetten',
    slug: 'sku-amstetten',
    color1Hex: '#2D2E82',
    color2Hex: '#FFFFFF',
    color3Hex: '#009639',
    accentColorHex: '#000000',
    aliases: ['SKU', 'Amstetten', 'SKU Ertl Glas Amstetten'],
  },
  {
    name: 'First Vienna FC 1894',
    shortName: 'First Vienna',
    slug: 'first-vienna-fc-1894',
    color1Hex: '#315CA3',
    color2Hex: '#FCE900',
    color3Hex: null,
    accentColorHex: '#000000',
    aliases: ['VIE', 'First Vienna', 'Vienna'],
  },
  {
    name: 'Young Violets Austria Wien',
    shortName: 'Young Violets',
    slug: 'young-violets-austria-wien',
    color1Hex: '#441678',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#441678',
    aliases: ['AUS', 'Young Violets', 'Austria Wien II'],
  },
  {
    name: 'SV Austria Salzburg',
    shortName: 'Austria Salzburg',
    slug: 'sv-austria-salzburg',
    color1Hex: '#452172',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#452172',
    aliases: ['SBG', 'Austria Salzburg', 'SVAS'],
  },
  {
    name: 'FC Hertha Wels',
    shortName: 'Hertha Wels',
    slug: 'fc-hertha-wels',
    color1Hex: '#00A556',
    color2Hex: '#0968B3',
    color3Hex: null,
    accentColorHex: '#E84941',
    aliases: ['FCH', 'Hertha Wels', 'Wels'],
  },
  {
    name: 'SK Rapid II',
    shortName: 'Rapid II',
    slug: 'sk-rapid-ii',
    color1Hex: '#00794C',
    color2Hex: '#FFFFFF',
    color3Hex: '#064F81',
    accentColorHex: '#E3000F',
    aliases: ['RAP', 'Rapid II', 'SK Rapid Wien II'],
  },
  {
    name: 'KSV 1919',
    shortName: 'KSV',
    slug: 'ksv-1919',
    color1Hex: '#E21C2A',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#C9CCCD',
    aliases: ['KSV', 'Kapfenberger SV', 'Kapfenberg'],
  },
  {
    name: 'SK Sturm Graz II',
    shortName: 'Sturm Graz II',
    slug: 'sk-sturm-graz-ii',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#43A94D',
    aliases: ['STU II', 'Sturm II', 'Sturm Graz II'],
  },
  {
    name: 'Schwarz-Weiß Bregenz',
    shortName: 'SW Bregenz',
    slug: 'schwarz-weiss-bregenz',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#000000',
    aliases: ['SWB', 'SW Bregenz', 'Schwarz Weiss Bregenz'],
  },
  {
    name: 'ASK Voitsberg',
    shortName: 'Voitsberg',
    slug: 'ask-voitsberg',
    color1Hex: '#FFFFFF',
    color2Hex: '#000000',
    color3Hex: null,
    accentColorHex: '#000000',
    aliases: ['VOI', 'Voitsberg'],
  },
  {
    name: 'FC Wacker Innsbruck',
    shortName: 'Wacker Innsbruck',
    slug: 'fc-wacker-innsbruck',
    color1Hex: '#008747',
    color2Hex: '#000000',
    color3Hex: null,
    accentColorHex: '#008747',
    aliases: ['FCW', 'Wacker Innsbruck', 'Wacker', 'FC Wacker'],
  },
] as const;

function hexToRgba(hex: string): string {
  const normalized = hex.trim().replace(/^#/, '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid club HEX color: ${hex}`);
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, 1)`;
}

function normalizeAlias(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function aliasType(alias: string, shortName: string | null) {
  if (shortName && alias === shortName) {
    return 'SHORT_NAME' as const;
  }

  if (/^[A-Z0-9]{2,6}(?: II)?$/.test(alias)) {
    return 'ABBREVIATION' as const;
  }

  return 'ALTERNATIVE' as const;
}

async function seedClubs() {
  console.log('Seeding clubs...');

  const result = new Map<string, { id: string; slug: string }>();

  for (const clubData of clubs) {
    const club = await prisma.club.upsert({
      where: {
        slug: clubData.slug,
      },
      update: {
        name: clubData.name,
        shortName: clubData.shortName,
        color1Hex: clubData.color1Hex,
        color1Rgba: hexToRgba(clubData.color1Hex),
        color2Hex: clubData.color2Hex,
        color2Rgba: hexToRgba(clubData.color2Hex),
        color3Hex: clubData.color3Hex,
        color3Rgba: clubData.color3Hex ? hexToRgba(clubData.color3Hex) : null,
        accentColorHex: clubData.accentColorHex,
        accentColorRgba: hexToRgba(clubData.accentColorHex),
        active: true,
      },
      create: {
        name: clubData.name,
        shortName: clubData.shortName,
        slug: clubData.slug,
        color1Hex: clubData.color1Hex,
        color1Rgba: hexToRgba(clubData.color1Hex),
        color2Hex: clubData.color2Hex,
        color2Rgba: hexToRgba(clubData.color2Hex),
        color3Hex: clubData.color3Hex,
        color3Rgba: clubData.color3Hex ? hexToRgba(clubData.color3Hex) : null,
        accentColorHex: clubData.accentColorHex,
        accentColorRgba: hexToRgba(clubData.accentColorHex),
        active: true,
      },
    });

    result.set(club.slug, club);

    const aliases = new Set<string>([clubData.shortName, ...clubData.aliases]);

    for (const alias of aliases) {
      const normalizedAlias = normalizeAlias(alias);

      await prisma.clubAlias.upsert({
        where: {
          clubId_normalizedAlias: {
            clubId: club.id,
            normalizedAlias,
          },
        },
        update: {
          alias,
          type: aliasType(alias, clubData.shortName),
          active: true,
        },
        create: {
          clubId: club.id,
          alias,
          normalizedAlias,
          type: aliasType(alias, clubData.shortName),
          active: true,
        },
      });
    }
  }

  return result;
}

async function seedCompetition(params: {
  name: string;
  shortName: string;
  slug: string;
  type: 'LEAGUE' | 'CUP';
  seasonStart: string;
  seasonEnd: string;
  stageName: string;
  stageSlug: string;
  stageType: 'REGULAR' | 'KNOCKOUT';
}) {
  const competition = await prisma.competition.upsert({
    where: {
      slug: params.slug,
    },
    // Preserve admin-managed competition metadata on subsequent seed runs.
    update: {},
    create: {
      name: params.name,
      shortName: params.shortName,
      slug: params.slug,
      type: params.type,
      countryCode: 'AT',
      active: true,
    },
  });

  const season = await prisma.season.upsert({
    where: {
      competitionId_slug: {
        competitionId: competition.id,
        slug: '2026-27',
      },
    },
    update: {
      name: '2026/27',
      startDate: new Date(params.seasonStart),
      endDate: new Date(params.seasonEnd),
      status: 'ACTIVE',
      active: true,
    },
    create: {
      competitionId: competition.id,
      name: '2026/27',
      slug: '2026-27',
      startDate: new Date(params.seasonStart),
      endDate: new Date(params.seasonEnd),
      status: 'ACTIVE',
      active: true,
    },
  });

  const stage = await prisma.stage.upsert({
    where: {
      seasonId_slug: {
        seasonId: season.id,
        slug: params.stageSlug,
      },
    },
    update: {
      name: params.stageName,
      type: params.stageType,
      sequence: 1,
    },
    create: {
      seasonId: season.id,
      name: params.stageName,
      slug: params.stageSlug,
      type: params.stageType,
      sequence: 1,
    },
  });

  return {
    competition,
    season,
    stage,
  };
}

async function seedCompetitions() {
  console.log('Seeding competitions, seasons and stages...');

  const bundesliga = await seedCompetition({
    name: 'Österreichische Bundesliga',
    shortName: 'Bundesliga',
    slug: 'austrian-bundesliga',
    type: 'LEAGUE',
    seasonStart: '2026-07-01T00:00:00.000Z',
    seasonEnd: '2027-06-30T00:00:00.000Z',
    stageName: 'Grunddurchgang',
    stageSlug: 'grunddurchgang',
    stageType: 'REGULAR',
  });

  const zweiteLiga = await seedCompetition({
    name: '2. Liga',
    shortName: '2. Liga',
    slug: 'austrian-2-liga',
    type: 'LEAGUE',
    seasonStart: '2026-07-01T00:00:00.000Z',
    seasonEnd: '2027-06-30T00:00:00.000Z',
    stageName: 'Grunddurchgang',
    stageSlug: 'grunddurchgang',
    stageType: 'REGULAR',
  });

  const oefbCup = await seedCompetition({
    name: 'ÖFB Cup',
    shortName: 'ÖFB Cup',
    slug: 'oefb-cup',
    type: 'CUP',
    seasonStart: '2026-07-24T00:00:00.000Z',
    seasonEnd: '2027-05-01T00:00:00.000Z',
    stageName: 'K.-o.-Phase',
    stageSlug: 'knockout',
    stageType: 'KNOCKOUT',
  });

  return {
    bundesliga,
    zweiteLiga,
    oefbCup,
  };
}

async function upsertMatch(params: {
  homeClubId: string;
  awayClubId: string;
  competitionId: string;
  seasonId: string;
  stageId: string;
  kickoff: string;
  matchday: number | null;
  status: 'SCHEDULED' | 'FINISHED';
  homeScore?: number;
  awayScore?: number;
}) {
  const kickoff = new Date(params.kickoff);

  const existing = await prisma.match.findFirst({
    where: {
      homeClubId: params.homeClubId,
      awayClubId: params.awayClubId,
      competitionId: params.competitionId,
      seasonId: params.seasonId,
      kickoff,
    },
  });

  const data = {
    homeClubId: params.homeClubId,
    awayClubId: params.awayClubId,
    competitionId: params.competitionId,
    seasonId: params.seasonId,
    stageId: params.stageId,
    kickoff,
    matchday: params.matchday,
    status: params.status,
    homeScore: params.homeScore ?? null,
    awayScore: params.awayScore ?? null,
  } as const;

  if (existing) {
    return prisma.match.update({
      where: {
        id: existing.id,
      },
      data,
    });
  }

  return prisma.match.create({
    data,
  });
}

async function seedMatches(
  seededClubs: Map<string, { id: string; slug: string }>,
  competitions: Awaited<ReturnType<typeof seedCompetitions>>,
) {
  console.log('Seeding test matches...');

  const clubId = (slug: string) => {
    const club = seededClubs.get(slug);

    if (!club) {
      throw new Error(`Seed club not found: ${slug}`);
    }

    return club.id;
  };

  const matches = [];

  // Bundesliga test fixtures
  matches.push(
    await upsertMatch({
      homeClubId: clubId('lask'),
      awayClubId: clubId('grazer-ak-1902'),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: '2026-07-31T17:30:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('sk-rapid-wien'),
      awayClubId: clubId('fk-austria-wien'),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: '2026-08-23T15:00:00.000Z',
      matchday: 4,
      status: 'SCHEDULED',
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('sk-sturm-graz'),
      awayClubId: clubId('fc-red-bull-salzburg'),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: '2026-09-12T15:00:00.000Z',
      matchday: 6,
      status: 'SCHEDULED',
    }),
  );

  // 2. Liga test fixtures
  matches.push(
    await upsertMatch({
      homeClubId: clubId('admira-wacker'),
      awayClubId: clubId('sk-rapid-ii'),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: '2026-07-31T16:30:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('young-violets-austria-wien'),
      awayClubId: clubId('fc-blau-weiss-linz'),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: '2026-07-31T16:30:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 3,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('first-vienna-fc-1894'),
      awayClubId: clubId('sk-sturm-graz-ii'),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: '2026-08-01T15:30:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 4,
      awayScore: 0,
    }),
  );

  // ÖFB Cup test fixtures.
  // These are intentionally development fixtures and are not an authoritative
  // representation of the official cup draw.
  matches.push(
    await upsertMatch({
      homeClubId: clubId('fc-wacker-innsbruck'),
      awayClubId: clubId('sk-rapid-wien'),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: '2026-07-25T16:00:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 3,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('sv-austria-salzburg'),
      awayClubId: clubId('sk-sturm-graz'),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: '2026-07-25T18:00:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 0,
      awayScore: 2,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId('ksv-1919'),
      awayClubId: clubId('lask'),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: '2026-09-05T16:00:00.000Z',
      matchday: 2,
      status: 'SCHEDULED',
    }),
  );

  return matches;
}

async function seedUsers(seededClubs: Map<string, { id: string; slug: string }>) {
  console.log('Seeding test users...');

  const rapid = seededClubs.get('sk-rapid-wien');
  const austria = seededClubs.get('fk-austria-wien');

  if (!rapid || !austria) {
    throw new Error('Required seed clubs for users are missing.');
  }

  const neutralUser = await prisma.user.upsert({
    where: {
      keycloakSubject: 'seed-neutral-user',
    },
    update: {
      nickname: 'seed_neutral',
      status: 'ACTIVE',
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: 'seed-neutral-user',
      nickname: 'seed_neutral',
      status: 'ACTIVE',
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      onboardingCompleted: true,
    },
  });

  const rapidUser = await prisma.user.upsert({
    where: {
      keycloakSubject: 'seed-rapid-user',
    },
    update: {
      nickname: 'seed_rapidfan',
      status: 'ACTIVE',
      fanPreference: 'CLUB',
      favoriteClubId: rapid.id,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: 'seed-rapid-user',
      nickname: 'seed_rapidfan',
      status: 'ACTIVE',
      fanPreference: 'CLUB',
      favoriteClubId: rapid.id,
      onboardingCompleted: true,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: {
      keycloakSubject: 'seed-editor-user',
    },
    update: {
      nickname: 'seed_editor',
      status: 'ACTIVE',
      fanPreference: 'CLUB',
      favoriteClubId: austria.id,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: 'seed-editor-user',
      nickname: 'seed_editor',
      status: 'ACTIVE',
      fanPreference: 'CLUB',
      favoriteClubId: austria.id,
      onboardingCompleted: true,
    },
  });

  for (const user of [neutralUser, rapidUser, editorUser]) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: 'USER',
        },
      },
      update: {},
      create: {
        userId: user.id,
        role: 'USER',
      },
    });
  }

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_role: {
        userId: editorUser.id,
        role: 'EDITOR',
      },
    },
    update: {},
    create: {
      userId: editorUser.id,
      role: 'EDITOR',
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: neutralUser.id,
    },
    update: {
      displayName: 'Seed Neutral',
      bio: 'Neutral Kurvenfunk development user.',
    },
    create: {
      userId: neutralUser.id,
      displayName: 'Seed Neutral',
      bio: 'Neutral Kurvenfunk development user.',
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: rapidUser.id,
    },
    update: {
      displayName: 'Seed Rapid Fan',
      bio: 'Rapid Kurvenfunk development user.',
    },
    create: {
      userId: rapidUser.id,
      displayName: 'Seed Rapid Fan',
      bio: 'Rapid Kurvenfunk development user.',
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: editorUser.id,
    },
    update: {
      displayName: 'Seed Editor',
      bio: 'Kurvenfunk development editor.',
    },
    create: {
      userId: editorUser.id,
      displayName: 'Seed Editor',
      bio: 'Kurvenfunk development editor.',
    },
  });

  return {
    neutralUser,
    rapidUser,
    editorUser,
  };
}

async function seedArticleSource() {
  const existing = await prisma.articleSource.findFirst({
    where: {
      name: 'Kurvenfunk Seed',
    },
  });

  if (existing) {
    return prisma.articleSource.update({
      where: {
        id: existing.id,
      },
      data: {
        active: true,
      },
    });
  }

  return prisma.articleSource.create({
    data: {
      name: 'Kurvenfunk Seed',
      active: true,
    },
  });
}

async function seedArticles(
  seededClubs: Map<string, { id: string; slug: string }>,
  competitions: Awaited<ReturnType<typeof seedCompetitions>>,
  users: Awaited<ReturnType<typeof seedUsers>>,
) {
  console.log('Seeding test articles...');

  const source = await seedArticleSource();

  const category = await prisma.category.upsert({
    where: {
      slug: 'seed-football',
    },
    update: {
      name: 'Seed Football',
      active: true,
    },
    create: {
      name: 'Seed Football',
      slug: 'seed-football',
      active: true,
    },
  });

  const tag = await prisma.tag.upsert({
    where: {
      slug: 'seed-data',
    },
    update: {
      name: 'Seed Data',
      active: true,
    },
    create: {
      name: 'Seed Data',
      slug: 'seed-data',
      active: true,
    },
  });

  const articleDefinitions = [
    {
      slug: 'seed-bundesliga-2026-27',
      title: 'Bundesliga 2026/27: Kurvenfunk Seed Article',
      lead: 'Development article for testing Bundesliga views and personalization.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['sk-rapid-wien', 'fk-austria-wien'],
      publishedAt: '2026-08-17T14:00:00.000Z',
      isTopNews: true,
    },
    {
      slug: 'seed-rapid-derby-vorbereitung',
      title: 'Rapid startet in die Vorbereitung auf das Wiener Derby',
      lead: 'Der Fokus liegt auf den letzten Einheiten vor dem nächsten großen Wiener Duell.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['sk-rapid-wien', 'fk-austria-wien'],
      publishedAt: '2026-08-17T11:30:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-sturm-kader-update',
      title: 'Sturm mit Kader-Update vor dem nächsten Ligaspiel',
      lead: 'Die Grazer bereiten sich auf die nächste Runde der Bundesliga vor.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['sk-sturm-graz'],
      publishedAt: '2026-08-17T09:15:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-salzburg-neue-impulse',
      title: 'Salzburg setzt im Training neue offensive Impulse',
      lead: 'Im Mittelpunkt stehen Tempo, Umschaltspiel und Varianten im letzten Drittel.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['fc-red-bull-salzburg'],
      publishedAt: '2026-08-16T18:45:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-lask-hartberg-vorschau',
      title: 'LASK und Hartberg vor einem spannenden Bundesliga-Duell',
      lead: 'Beide Mannschaften wollen mit einem Erfolg wichtige Punkte sammeln.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['lask', 'tsv-hartberg'],
      publishedAt: '2026-08-16T15:20:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-wac-altach-analyse',
      title: 'WAC und Altach im Formcheck',
      lead: 'Ein Blick auf die jüngsten Auftritte und die Ausgangslage vor der nächsten Runde.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['wolfsberger-ac', 'scr-altach'],
      publishedAt: '2026-08-15T17:10:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-ried-saisonstart',
      title: 'Ried arbeitet weiter am starken Saisonstart',
      lead: 'Die Innviertler wollen den positiven Trend in den kommenden Spielen bestätigen.',
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ['sv-ried'],
      publishedAt: '2026-08-15T12:00:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-2-liga-2026-27',
      title: '2. Liga 2026/27: Kurvenfunk Seed Article',
      lead: 'Development article for testing 2. Liga views and club matching.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['fc-blau-weiss-linz', 'fc-wacker-innsbruck'],
      publishedAt: '2026-08-14T16:00:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-vienna-admira',
      title: 'Vienna und Admira richten den Blick auf die nächste Runde',
      lead: 'Zwei Traditionsklubs bereiten sich auf ihre nächsten Aufgaben in der 2. Liga vor.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['first-vienna-fc-1894', 'admira-wacker'],
      publishedAt: '2026-08-14T11:30:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-st-poelten-fac',
      title: 'St. Pölten und FAC wollen wichtige Punkte holen',
      lead: 'Die nächsten Partien könnten für beide Teams früh richtungsweisend werden.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['skn-st-poelten', 'fac-wien'],
      publishedAt: '2026-08-13T15:40:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-amstetten-liefering',
      title: 'Amstetten trifft auf junge Lieferinger Mannschaft',
      lead: 'Erfahrung trifft auf Talent in einem interessanten Duell der 2. Liga.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['sku-amstetten', 'fc-liefering'],
      publishedAt: '2026-08-12T13:25:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-wacker-austria-salzburg',
      title: 'Wacker Innsbruck und Austria Salzburg im Traditionsduell',
      lead: 'Zwei bekannte Namen des österreichischen Fußballs stehen einander gegenüber.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['fc-wacker-innsbruck', 'sv-austria-salzburg'],
      publishedAt: '2026-08-11T19:00:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-oefb-cup-2026-27',
      title: 'ÖFB Cup 2026/27: Kurvenfunk Seed Article',
      lead: 'Development article for testing cup content and competition assignments.',
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ['sk-sturm-graz', 'sk-rapid-wien'],
      publishedAt: '2026-08-10T18:00:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-cup-austria-gak',
      title: 'Austria und GAK mit anspruchsvollen Aufgaben im ÖFB Cup',
      lead: 'Die beiden Traditionsvereine wollen im Cup den nächsten Schritt machen.',
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ['fk-austria-wien', 'grazer-ak-1902'],
      publishedAt: '2026-08-09T14:30:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-cup-kapfenberg-bregenz',
      title: 'Kapfenberg und Bregenz hoffen auf eine lange Cup-Reise',
      lead: 'Im Pokal zählt für beide Teams vor allem das Weiterkommen.',
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ['ksv-1919', 'schwarz-weiss-bregenz'],
      publishedAt: '2026-08-08T12:15:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-cup-voitsberg-hertha-wels',
      title: 'Voitsberg und Hertha Wels vor besonderem Cup-Abend',
      lead: 'Der ÖFB Cup bietet beiden Vereinen die Bühne für ein besonderes Spiel.',
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ['ask-voitsberg', 'fc-hertha-wels'],
      publishedAt: '2026-08-07T17:45:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-rapid-ii-sturm-ii',
      title: 'Rapid II und Sturm II setzen auf junge Talente',
      lead: 'Bei beiden Mannschaften steht die Entwicklung junger Spieler im Mittelpunkt.',
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ['sk-rapid-ii', 'sk-sturm-graz-ii'],
      publishedAt: '2026-08-06T10:30:00.000Z',
      isTopNews: false,
    },
    {
      slug: 'seed-cup-blau-weiss-rapid',
      title: 'Blau-Weiß Linz empfängt Rapid im ÖFB Cup',
      lead: 'Das direkte Duell verspricht eine interessante Cup-Begegnung.',
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ['fc-blau-weiss-linz', 'sk-rapid-wien'],
      publishedAt: '2026-08-05T18:20:00.000Z',
      isTopNews: false,
    },
  ] as const;

  for (const definition of articleDefinitions) {
    const article = await prisma.article.upsert({
      where: {
        slug: definition.slug,
      },
      update: {
        title: definition.title,
        lead: definition.lead,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is deterministic Kurvenfunk development seed content.',
                },
              ],
            },
          ],
        },
        status: 'PUBLISHED',
        authorId: users.editorUser.id,
        sourceId: source.id,
        competitionId: definition.competitionId,
        isTopNews: definition.isTopNews,
        publishedAt: new Date(definition.publishedAt),
        archivedAt: null,
        deletedAt: null,
      },
      create: {
        title: definition.title,
        slug: definition.slug,
        lead: definition.lead,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is deterministic Kurvenfunk development seed content.',
                },
              ],
            },
          ],
        },
        status: 'PUBLISHED',
        authorId: users.editorUser.id,
        sourceId: source.id,
        competitionId: definition.competitionId,
        isTopNews: definition.isTopNews,
        publishedAt: new Date(definition.publishedAt),
      },
    });

    await prisma.articleCategory.upsert({
      where: {
        articleId_categoryId: {
          articleId: article.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        articleId: article.id,
        categoryId: category.id,
      },
    });

    await prisma.articleTag.upsert({
      where: {
        articleId_tagId: {
          articleId: article.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        articleId: article.id,
        tagId: tag.id,
      },
    });

    for (const slug of definition.clubSlugs) {
      const club = seededClubs.get(slug);

      if (!club) {
        throw new Error(`Seed article club not found: ${slug}`);
      }

      await prisma.articleClub.upsert({
        where: {
          articleId_clubId: {
            articleId: article.id,
            clubId: club.id,
          },
        },
        update: {},
        create: {
          articleId: article.id,
          clubId: club.id,
        },
      });
    }
  }
}

async function printSummary() {
  const [
    clubCount,
    aliasCount,
    competitionCount,
    seasonCount,
    stageCount,
    userCount,
    matchCount,
    articleCount,
  ] = await Promise.all([
    prisma.club.count({
      where: {
        slug: {
          in: clubs.map((club) => club.slug),
        },
      },
    }),
    prisma.clubAlias.count({
      where: {
        club: {
          slug: {
            in: clubs.map((club) => club.slug),
          },
        },
      },
    }),
    prisma.competition.count({
      where: {
        slug: {
          in: ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'],
        },
      },
    }),
    prisma.season.count({
      where: {
        slug: '2026-27',
        competition: {
          slug: {
            in: ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'],
          },
        },
      },
    }),
    prisma.stage.count({
      where: {
        season: {
          slug: '2026-27',
          competition: {
            slug: {
              in: ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'],
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        keycloakSubject: {
          in: ['seed-neutral-user', 'seed-rapid-user', 'seed-editor-user'],
        },
      },
    }),
    prisma.match.count({
      where: {
        season: {
          slug: '2026-27',
          competition: {
            slug: {
              in: ['austrian-bundesliga', 'austrian-2-liga', 'oefb-cup'],
            },
          },
        },
      },
    }),
    prisma.article.count({
      where: {
        slug: {
          startsWith: 'seed-',
        },
      },
    }),
  ]);

  console.log('');
  console.log('Kurvenfunk seed completed.');
  console.log(`Clubs:        ${clubCount}`);
  console.log(`Club aliases: ${aliasCount}`);
  console.log(`Competitions: ${competitionCount}`);
  console.log(`Seasons:      ${seasonCount}`);
  console.log(`Stages:       ${stageCount}`);
  console.log(`Test users:   ${userCount}`);
  console.log(`Test matches: ${matchCount}`);
  console.log(`Test articles:${articleCount}`);
}

async function main() {
  console.log('Starting Kurvenfunk database seed...');
  console.log('');

  const seededClubs = await seedClubs();
  const competitions = await seedCompetitions();
  const users = await seedUsers(seededClubs);

  await seedMatches(seededClubs, competitions);
  await seedArticles(seededClubs, competitions, users);
  await printSummary();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Kurvenfunk database seed failed.');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
