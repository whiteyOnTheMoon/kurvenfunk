import { createPrismaClient } from "../src/client.js";

const prisma = createPrismaClient();

const clubs = [
  // ---------------------------------------------------------------------------
  // ADMIRAL Bundesliga 2026/27
  // ---------------------------------------------------------------------------
  {
    name: "LASK",
    shortName: "LASK",
    slug: "lask",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#CCCCCC",
    aliases: ["ASK", "Linzer ASK", "LASK Linz"],
  },
  {
    name: "SK Sturm Graz",
    shortName: "Sturm Graz",
    slug: "sk-sturm-graz",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#808080",
    aliases: ["STU", "Sturm", "Sturm Graz", "SK Puntigamer Sturm Graz"],
  },
  {
    name: "FC Red Bull Salzburg",
    shortName: "Salzburg",
    slug: "fc-red-bull-salzburg",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
    accentColor: "#001E50",
    aliases: ["RBS", "Red Bull Salzburg", "RB Salzburg", "Salzburg"],
  },
  {
    name: "FK Austria Wien",
    shortName: "Austria Wien",
    slug: "fk-austria-wien",
    primaryColor: "#5B2C83",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    aliases: ["FAK", "Austria", "Austria Wien", "Veilchen"],
  },
  {
    name: "SK Rapid Wien",
    shortName: "Rapid Wien",
    slug: "sk-rapid-wien",
    primaryColor: "#007A3D",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    aliases: ["SCR", "SK Rapid", "Rapid", "Rapid Wien"],
  },
  {
    name: "TSV Hartberg",
    shortName: "Hartberg",
    slug: "tsv-hartberg",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    accentColor: "#00AEEF",
    aliases: ["HTB", "Hartberg", "TSV Egger Glas Hartberg"],
  },
  {
    name: "SV Ried",
    shortName: "Ried",
    slug: "sv-ried",
    primaryColor: "#009640",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    aliases: ["SVR", "Ried", "SV Oberbank Ried"],
  },
  {
    name: "Wolfsberger AC",
    shortName: "WAC",
    slug: "wolfsberger-ac",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#D71920",
    aliases: ["WAC", "Wolfsberg", "RZ Pellets WAC"],
  },
  {
    name: "SCR Altach",
    shortName: "Altach",
    slug: "scr-altach",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#F4C430",
    aliases: ["ALT", "Altach", "Rheindorf Altach"],
  },
  {
    name: "Grazer AK 1902",
    shortName: "GAK",
    slug: "grazer-ak-1902",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["GAK", "Grazer AK", "GAK 1902"],
  },
  {
    name: "WSG Tirol",
    shortName: "WSG Tirol",
    slug: "wsg-tirol",
    primaryColor: "#00843D",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["WSG", "WSG", "WSG Wattens", "Wattens"],
  },
  {
    name: "SC Austria Lustenau",
    shortName: "Austria Lustenau",
    slug: "sc-austria-lustenau",
    primaryColor: "#00843D",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["ALU", "Austria Lustenau", "Lustenau"],
  },

  // ---------------------------------------------------------------------------
  // ADMIRAL 2. Liga 2026/27
  // ---------------------------------------------------------------------------
  {
    name: "FC Blau-Weiß Linz",
    shortName: "Blau-Weiß Linz",
    slug: "fc-blau-weiss-linz",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    accentColor: "#003E7E",
    aliases: ["BWL", "Blau Weiß Linz", "Blau-Weiß Linz", "BW Linz"],
  },
  {
    name: "SKN St. Pölten",
    shortName: "SKN St. Pölten",
    slug: "skn-st-poelten",
    primaryColor: "#0057B8",
    secondaryColor: "#FFD700",
    accentColor: "#FFFFFF",
    aliases: ["SKN", "St. Pölten", "SKN St Pölten"],
  },
  {
    name: "Admira Wacker",
    shortName: "Admira",
    slug: "admira-wacker",
    primaryColor: "#D71920",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    aliases: ["ADM", "Admira", "FC Admira Wacker", "FC Admira"],
  },
  {
    name: "FAC Wien",
    shortName: "FAC",
    slug: "fac-wien",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["FAC", "Floridsdorfer AC", "FAC WIEN"],
  },
  {
    name: "FC Liefering",
    shortName: "Liefering",
    slug: "fc-liefering",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
    accentColor: "#001E50",
    aliases: ["FCL", "Liefering"],
  },
  {
    name: "SKU Amstetten",
    shortName: "Amstetten",
    slug: "sku-amstetten",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["SKU", "Amstetten", "SKU Ertl Glas Amstetten"],
  },
  {
    name: "First Vienna FC 1894",
    shortName: "First Vienna",
    slug: "first-vienna-fc-1894",
    primaryColor: "#0057B8",
    secondaryColor: "#FFD700",
    accentColor: "#FFFFFF",
    aliases: ["VIE", "First Vienna", "Vienna"],
  },
  {
    name: "Young Violets Austria Wien",
    shortName: "Young Violets",
    slug: "young-violets-austria-wien",
    primaryColor: "#5B2C83",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    aliases: ["AUS", "Young Violets", "Austria Wien II"],
  },
  {
    name: "SV Austria Salzburg",
    shortName: "Austria Salzburg",
    slug: "sv-austria-salzburg",
    primaryColor: "#5B2C83",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["SBG", "Austria Salzburg", "SVAS"],
  },
  {
    name: "FC Hertha Wels",
    shortName: "Hertha Wels",
    slug: "fc-hertha-wels",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["FCH", "Hertha Wels", "Wels"],
  },
  {
    name: "SK Rapid II",
    shortName: "Rapid II",
    slug: "sk-rapid-ii",
    primaryColor: "#007A3D",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    aliases: ["RAP", "Rapid II", "SK Rapid Wien II"],
  },
  {
    name: "KSV 1919",
    shortName: "KSV",
    slug: "ksv-1919",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    aliases: ["KSV", "Kapfenberger SV", "Kapfenberg"],
  },
  {
    name: "SK Sturm Graz II",
    shortName: "Sturm Graz II",
    slug: "sk-sturm-graz-ii",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#808080",
    aliases: ["STU II", "Sturm II", "Sturm Graz II"],
  },
  {
    name: "Schwarz-Weiß Bregenz",
    shortName: "SW Bregenz",
    slug: "schwarz-weiss-bregenz",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#808080",
    aliases: ["SWB", "SW Bregenz", "Schwarz Weiss Bregenz"],
  },
  {
    name: "ASK Voitsberg",
    shortName: "Voitsberg",
    slug: "ask-voitsberg",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#D71920",
    aliases: ["VOI", "Voitsberg"],
  },
  {
    name: "FC Wacker Innsbruck",
    shortName: "Wacker Innsbruck",
    slug: "fc-wacker-innsbruck",
    primaryColor: "#00843D",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    aliases: ["FCW", "Wacker Innsbruck", "Wacker", "FC Wacker"],
  },
] as const;

function normalizeAlias(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function aliasType(alias: string, shortName: string | null) {
  if (shortName && alias === shortName) {
    return "SHORT_NAME" as const;
  }

  if (/^[A-Z0-9]{2,6}(?: II)?$/.test(alias)) {
    return "ABBREVIATION" as const;
  }

  return "ALTERNATIVE" as const;
}

async function seedClubs() {
  console.log("Seeding clubs...");

  const result = new Map<string, { id: string; slug: string }>();

  for (const clubData of clubs) {
    const club = await prisma.club.upsert({
      where: {
        slug: clubData.slug,
      },
      update: {
        name: clubData.name,
        shortName: clubData.shortName,
        primaryColor: clubData.primaryColor,
        secondaryColor: clubData.secondaryColor,
        accentColor: clubData.accentColor,
        active: true,
      },
      create: {
        name: clubData.name,
        shortName: clubData.shortName,
        slug: clubData.slug,
        primaryColor: clubData.primaryColor,
        secondaryColor: clubData.secondaryColor,
        accentColor: clubData.accentColor,
        active: true,
      },
    });

    result.set(club.slug, club);

    const aliases = new Set<string>([
      clubData.shortName,
      ...clubData.aliases,
    ]);

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
  type: "LEAGUE" | "CUP";
  seasonStart: string;
  seasonEnd: string;
  stageName: string;
  stageSlug: string;
  stageType: "REGULAR" | "KNOCKOUT";
}) {
  const competition = await prisma.competition.upsert({
    where: {
      slug: params.slug,
    },
    update: {
      name: params.name,
      shortName: params.shortName,
      type: params.type,
      countryCode: "AT",
      active: true,
    },
    create: {
      name: params.name,
      shortName: params.shortName,
      slug: params.slug,
      type: params.type,
      countryCode: "AT",
      active: true,
    },
  });

  const season = await prisma.season.upsert({
    where: {
      competitionId_slug: {
        competitionId: competition.id,
        slug: "2026-27",
      },
    },
    update: {
      name: "2026/27",
      startDate: new Date(params.seasonStart),
      endDate: new Date(params.seasonEnd),
      status: "ACTIVE",
      active: true,
    },
    create: {
      competitionId: competition.id,
      name: "2026/27",
      slug: "2026-27",
      startDate: new Date(params.seasonStart),
      endDate: new Date(params.seasonEnd),
      status: "ACTIVE",
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
  console.log("Seeding competitions, seasons and stages...");

  const bundesliga = await seedCompetition({
    name: "Österreichische Bundesliga",
    shortName: "Bundesliga",
    slug: "austrian-bundesliga",
    type: "LEAGUE",
    seasonStart: "2026-07-01T00:00:00.000Z",
    seasonEnd: "2027-06-30T00:00:00.000Z",
    stageName: "Grunddurchgang",
    stageSlug: "grunddurchgang",
    stageType: "REGULAR",
  });

  const zweiteLiga = await seedCompetition({
    name: "2. Liga",
    shortName: "2. Liga",
    slug: "austrian-2-liga",
    type: "LEAGUE",
    seasonStart: "2026-07-01T00:00:00.000Z",
    seasonEnd: "2027-06-30T00:00:00.000Z",
    stageName: "Grunddurchgang",
    stageSlug: "grunddurchgang",
    stageType: "REGULAR",
  });

  const oefbCup = await seedCompetition({
    name: "ÖFB Cup",
    shortName: "ÖFB Cup",
    slug: "oefb-cup",
    type: "CUP",
    seasonStart: "2026-07-24T00:00:00.000Z",
    seasonEnd: "2027-05-01T00:00:00.000Z",
    stageName: "K.-o.-Phase",
    stageSlug: "knockout",
    stageType: "KNOCKOUT",
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
  status: "SCHEDULED" | "FINISHED";
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
  console.log("Seeding test matches...");

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
      homeClubId: clubId("lask"),
      awayClubId: clubId("grazer-ak-1902"),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: "2026-07-31T17:30:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 2,
      awayScore: 0,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("sk-rapid-wien"),
      awayClubId: clubId("fk-austria-wien"),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: "2026-08-23T15:00:00.000Z",
      matchday: 4,
      status: "SCHEDULED",
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("sk-sturm-graz"),
      awayClubId: clubId("fc-red-bull-salzburg"),
      competitionId: competitions.bundesliga.competition.id,
      seasonId: competitions.bundesliga.season.id,
      stageId: competitions.bundesliga.stage.id,
      kickoff: "2026-09-12T15:00:00.000Z",
      matchday: 6,
      status: "SCHEDULED",
    }),
  );

  // 2. Liga test fixtures
  matches.push(
    await upsertMatch({
      homeClubId: clubId("admira-wacker"),
      awayClubId: clubId("sk-rapid-ii"),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: "2026-07-31T16:30:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("young-violets-austria-wien"),
      awayClubId: clubId("fc-blau-weiss-linz"),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: "2026-07-31T16:30:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 1,
      awayScore: 3,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("first-vienna-fc-1894"),
      awayClubId: clubId("sk-sturm-graz-ii"),
      competitionId: competitions.zweiteLiga.competition.id,
      seasonId: competitions.zweiteLiga.season.id,
      stageId: competitions.zweiteLiga.stage.id,
      kickoff: "2026-08-01T15:30:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 4,
      awayScore: 0,
    }),
  );

  // ÖFB Cup test fixtures.
  // These are intentionally development fixtures and are not an authoritative
  // representation of the official cup draw.
  matches.push(
    await upsertMatch({
      homeClubId: clubId("fc-wacker-innsbruck"),
      awayClubId: clubId("sk-rapid-wien"),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: "2026-07-25T16:00:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 1,
      awayScore: 3,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("sv-austria-salzburg"),
      awayClubId: clubId("sk-sturm-graz"),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: "2026-07-25T18:00:00.000Z",
      matchday: 1,
      status: "FINISHED",
      homeScore: 0,
      awayScore: 2,
    }),
  );

  matches.push(
    await upsertMatch({
      homeClubId: clubId("ksv-1919"),
      awayClubId: clubId("lask"),
      competitionId: competitions.oefbCup.competition.id,
      seasonId: competitions.oefbCup.season.id,
      stageId: competitions.oefbCup.stage.id,
      kickoff: "2026-09-05T16:00:00.000Z",
      matchday: 2,
      status: "SCHEDULED",
    }),
  );

  return matches;
}

async function seedUsers(
  seededClubs: Map<string, { id: string; slug: string }>,
) {
  console.log("Seeding test users...");

  const rapid = seededClubs.get("sk-rapid-wien");
  const austria = seededClubs.get("fk-austria-wien");

  if (!rapid || !austria) {
    throw new Error("Required seed clubs for users are missing.");
  }

  const neutralUser = await prisma.user.upsert({
    where: {
      keycloakSubject: "seed-neutral-user",
    },
    update: {
      nickname: "seed_neutral",
      status: "ACTIVE",
      fanPreference: "NEUTRAL",
      favoriteClubId: null,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: "seed-neutral-user",
      nickname: "seed_neutral",
      status: "ACTIVE",
      fanPreference: "NEUTRAL",
      favoriteClubId: null,
      onboardingCompleted: true,
    },
  });

  const rapidUser = await prisma.user.upsert({
    where: {
      keycloakSubject: "seed-rapid-user",
    },
    update: {
      nickname: "seed_rapidfan",
      status: "ACTIVE",
      fanPreference: "CLUB",
      favoriteClubId: rapid.id,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: "seed-rapid-user",
      nickname: "seed_rapidfan",
      status: "ACTIVE",
      fanPreference: "CLUB",
      favoriteClubId: rapid.id,
      onboardingCompleted: true,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: {
      keycloakSubject: "seed-editor-user",
    },
    update: {
      nickname: "seed_editor",
      status: "ACTIVE",
      fanPreference: "CLUB",
      favoriteClubId: austria.id,
      onboardingCompleted: true,
    },
    create: {
      keycloakSubject: "seed-editor-user",
      nickname: "seed_editor",
      status: "ACTIVE",
      fanPreference: "CLUB",
      favoriteClubId: austria.id,
      onboardingCompleted: true,
    },
  });

  for (const user of [neutralUser, rapidUser, editorUser]) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: "USER",
        },
      },
      update: {},
      create: {
        userId: user.id,
        role: "USER",
      },
    });
  }

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_role: {
        userId: editorUser.id,
        role: "EDITOR",
      },
    },
    update: {},
    create: {
      userId: editorUser.id,
      role: "EDITOR",
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: neutralUser.id,
    },
    update: {
      displayName: "Seed Neutral",
      bio: "Neutral Kurvenfunk development user.",
    },
    create: {
      userId: neutralUser.id,
      displayName: "Seed Neutral",
      bio: "Neutral Kurvenfunk development user.",
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: rapidUser.id,
    },
    update: {
      displayName: "Seed Rapid Fan",
      bio: "Rapid Kurvenfunk development user.",
    },
    create: {
      userId: rapidUser.id,
      displayName: "Seed Rapid Fan",
      bio: "Rapid Kurvenfunk development user.",
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: editorUser.id,
    },
    update: {
      displayName: "Seed Editor",
      bio: "Kurvenfunk development editor.",
    },
    create: {
      userId: editorUser.id,
      displayName: "Seed Editor",
      bio: "Kurvenfunk development editor.",
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
      name: "Kurvenfunk Seed",
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
      name: "Kurvenfunk Seed",
      active: true,
    },
  });
}

async function seedArticles(
  seededClubs: Map<string, { id: string; slug: string }>,
  competitions: Awaited<ReturnType<typeof seedCompetitions>>,
  users: Awaited<ReturnType<typeof seedUsers>>,
) {
  console.log("Seeding test articles...");

  const source = await seedArticleSource();

  const category = await prisma.category.upsert({
    where: {
      slug: "seed-football",
    },
    update: {
      name: "Seed Football",
      active: true,
    },
    create: {
      name: "Seed Football",
      slug: "seed-football",
      active: true,
    },
  });

  const tag = await prisma.tag.upsert({
    where: {
      slug: "seed-data",
    },
    update: {
      name: "Seed Data",
      active: true,
    },
    create: {
      name: "Seed Data",
      slug: "seed-data",
      active: true,
    },
  });

  const articleDefinitions = [
    {
      slug: "seed-bundesliga-2026-27",
      title: "Bundesliga 2026/27: Kurvenfunk Seed Article",
      lead: "Development article for testing Bundesliga views and personalization.",
      competitionId: competitions.bundesliga.competition.id,
      clubSlugs: ["sk-rapid-wien", "fk-austria-wien"],
    },
    {
      slug: "seed-2-liga-2026-27",
      title: "2. Liga 2026/27: Kurvenfunk Seed Article",
      lead: "Development article for testing 2. Liga views and club matching.",
      competitionId: competitions.zweiteLiga.competition.id,
      clubSlugs: ["fc-blau-weiss-linz", "fc-wacker-innsbruck"],
    },
    {
      slug: "seed-oefb-cup-2026-27",
      title: "ÖFB Cup 2026/27: Kurvenfunk Seed Article",
      lead: "Development article for testing cup content and competition assignments.",
      competitionId: competitions.oefbCup.competition.id,
      clubSlugs: ["sk-sturm-graz", "sk-rapid-wien"],
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
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This is deterministic Kurvenfunk development seed content.",
                },
              ],
            },
          ],
        },
        status: "PUBLISHED",
        authorId: users.editorUser.id,
        sourceId: source.id,
        competitionId: definition.competitionId,
        publishedAt: new Date("2026-08-01T10:00:00.000Z"),
        archivedAt: null,
        deletedAt: null,
      },
      create: {
        title: definition.title,
        slug: definition.slug,
        lead: definition.lead,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This is deterministic Kurvenfunk development seed content.",
                },
              ],
            },
          ],
        },
        status: "PUBLISHED",
        authorId: users.editorUser.id,
        sourceId: source.id,
        competitionId: definition.competitionId,
        publishedAt: new Date("2026-08-01T10:00:00.000Z"),
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
          in: ["austrian-bundesliga", "austrian-2-liga", "oefb-cup"],
        },
      },
    }),
    prisma.season.count({
      where: {
        slug: "2026-27",
        competition: {
          slug: {
            in: ["austrian-bundesliga", "austrian-2-liga", "oefb-cup"],
          },
        },
      },
    }),
    prisma.stage.count({
      where: {
        season: {
          slug: "2026-27",
          competition: {
            slug: {
              in: ["austrian-bundesliga", "austrian-2-liga", "oefb-cup"],
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        keycloakSubject: {
          in: [
            "seed-neutral-user",
            "seed-rapid-user",
            "seed-editor-user",
          ],
        },
      },
    }),
    prisma.match.count({
      where: {
        season: {
          slug: "2026-27",
          competition: {
            slug: {
              in: ["austrian-bundesliga", "austrian-2-liga", "oefb-cup"],
            },
          },
        },
      },
    }),
    prisma.article.count({
      where: {
        slug: {
          in: [
            "seed-bundesliga-2026-27",
            "seed-2-liga-2026-27",
            "seed-oefb-cup-2026-27",
          ],
        },
      },
    }),
  ]);

  console.log("");
  console.log("Kurvenfunk seed completed.");
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
  console.log("Starting Kurvenfunk database seed...");
  console.log("");

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
    console.error("Kurvenfunk database seed failed.");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
