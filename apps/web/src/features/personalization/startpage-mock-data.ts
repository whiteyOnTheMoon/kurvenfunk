export interface MockClub {
  name: string;
  shortName: string;
  slug: string;
  logo: string;
}

export interface MockArticle {
  id: string;
  category: string;
  title: string;
  lead: string;
  time: string;
  featured?: boolean;
}

export interface MockMatch {
  id: string;
  competition: string;
  matchday: string;
  date: string;
  status?: string;
  home: MockClub;
  away: MockClub;
  homeScore?: number;
  awayScore?: number;
}

export interface MockStandingRow {
  position: number;
  club: MockClub;
  played: number;
  goalDifference: number;
  points: number;
}

export interface MockDiscussion {
  id: string;
  title: string;
  context: string;
  replies: number;
  lastActivity: string;
}

export const clubs = {
  sturm: {
    name: 'SK Sturm Graz',
    shortName: 'Sturm',
    slug: 'sk-sturm-graz',
    logo: '/clubs/sk-sturm-graz.svg',
  },
  rapid: {
    name: 'SK Rapid Wien',
    shortName: 'Rapid',
    slug: 'sk-rapid-wien',
    logo: '/clubs/sk-rapid-wien.svg',
  },
  austria: {
    name: 'FK Austria Wien',
    shortName: 'Austria',
    slug: 'fk-austria-wien',
    logo: '/clubs/fk-austria-wien.svg',
  },
  salzburg: {
    name: 'FC Red Bull Salzburg',
    shortName: 'Salzburg',
    slug: 'fc-red-bull-salzburg',
    logo: '/clubs/fc-red-bull-salzburg.svg',
  },
  lask: {
    name: 'LASK',
    shortName: 'LASK',
    slug: 'lask',
    logo: '/clubs/lask.svg',
  },
  wac: {
    name: 'Wolfsberger AC',
    shortName: 'WAC',
    slug: 'wolfsberger-ac',
    logo: '/clubs/wolfsberger-ac.svg',
  },
  hartberg: {
    name: 'TSV Hartberg',
    shortName: 'Hartberg',
    slug: 'tsv-hartberg',
    logo: '/clubs/tsv-hartberg.svg',
  },
  altach: {
    name: 'SCR Altach',
    shortName: 'Altach',
    slug: 'scr-altach',
    logo: '/clubs/scr-altach.svg',
  },
} satisfies Record<string, MockClub>;

export const neutralTopNews: MockArticle[] = [
  {
    id: 'top-1',
    category: 'Bundesliga',
    title: 'Der nächste Spieltag verspricht Duelle mit richtungsweisendem Charakter',
    lead: 'Die Liga geht in die nächste Runde. An mehreren Schauplätzen könnten bereits wichtige Weichen gestellt werden.',
    time: 'vor 24 Min.',
    featured: true,
  },
  {
    id: 'top-2',
    category: 'Analyse',
    title: 'Was sich bei den Topteams in dieser Saison verändert hat',
    lead: 'Neue Rollen, neue Ideen und mehrere spannende Entwicklungen prägen die ersten Wochen.',
    time: 'vor 51 Min.',
  },
  {
    id: 'top-3',
    category: 'Transfer',
    title: 'Diese Personalien könnten bis Transferschluss noch wichtig werden',
    lead: 'Mehrere Bundesligisten halten ihre Augen auf dem Transfermarkt offen.',
    time: 'vor 1 Std.',
  },
];

export const clubNews: MockArticle[] = [
  {
    id: 'club-1',
    category: 'Sturm Graz',
    title: 'Sturm richtet den Blick bereits auf das nächste Spitzenspiel',
    lead: 'Nach einer intensiven Trainingswoche steigt in Graz die Vorfreude auf das kommende Duell.',
    time: 'vor 18 Min.',
    featured: true,
  },
  {
    id: 'club-2',
    category: 'Mannschaft',
    title: 'Konkurrenzkampf im Mittelfeld nimmt weiter Fahrt auf',
    lead: 'Mehrere Spieler drängen sich für die Startelf auf und sorgen für zusätzliche Optionen.',
    time: 'vor 47 Min.',
  },
  {
    id: 'club-3',
    category: 'Verein',
    title: 'Volles Haus erwartet: Fans sorgen schon vor dem Spiel für Stimmung',
    lead: 'Die Nachfrage nach Tickets ist groß. Rund um die Arena wird erneut mit starker Kulisse gerechnet.',
    time: 'vor 2 Std.',
  },
];

export const leagueNews: MockArticle[] = [
  {
    id: 'league-1',
    category: 'Bundesliga',
    title: 'Rapid will nachlegen und den positiven Lauf fortsetzen',
    lead: 'Die Hütteldorfer gehen mit Selbstvertrauen in die nächste Aufgabe.',
    time: 'vor 36 Min.',
  },
  {
    id: 'league-2',
    category: 'Bundesliga',
    title: 'Salzburg setzt im nächsten Duell erneut auf hohes Tempo',
    lead: 'Der Fokus liegt auf aggressivem Pressing und schnellen Umschaltmomenten.',
    time: 'vor 1 Std.',
  },
  {
    id: 'league-3',
    category: 'Bundesliga',
    title: 'Austria sieht vor Heimspiel noch Luft nach oben',
    lead: 'Trotz guter Phasen soll vor allem die Effizienz verbessert werden.',
    time: 'vor 3 Std.',
  },
];

export const currentMatches: MockMatch[] = [
  {
    id: 'match-1',
    competition: 'Bundesliga',
    matchday: '4. Spieltag',
    date: 'Sa., 17:00',
    home: clubs.rapid,
    away: clubs.sturm,
  },
  {
    id: 'match-2',
    competition: 'Bundesliga',
    matchday: '4. Spieltag',
    date: 'Sa., 19:30',
    home: clubs.salzburg,
    away: clubs.austria,
  },
  {
    id: 'match-3',
    competition: 'Bundesliga',
    matchday: '4. Spieltag',
    date: 'So., 17:00',
    home: clubs.lask,
    away: clubs.wac,
  },
];

export const clubNextMatch: MockMatch = {
  id: 'club-next',
  competition: 'Bundesliga',
  matchday: '4. Spieltag',
  date: 'Samstag · 17:00',
  home: clubs.rapid,
  away: clubs.sturm,
};

export const clubLastMatch: MockMatch = {
  id: 'club-last',
  competition: 'Bundesliga',
  matchday: '3. Spieltag',
  date: 'Beendet',
  status: 'Endstand',
  home: clubs.sturm,
  away: clubs.hartberg,
  homeScore: 3,
  awayScore: 1,
};

export const standings: MockStandingRow[] = [
  { position: 1, club: clubs.sturm, played: 3, goalDifference: 6, points: 9 },
  { position: 2, club: clubs.rapid, played: 3, goalDifference: 4, points: 7 },
  { position: 3, club: clubs.salzburg, played: 3, goalDifference: 3, points: 6 },
  { position: 4, club: clubs.austria, played: 3, goalDifference: 2, points: 6 },
  { position: 5, club: clubs.lask, played: 3, goalDifference: 1, points: 4 },
  { position: 6, club: clubs.wac, played: 3, goalDifference: 0, points: 4 },
];

export const discussions: MockDiscussion[] = [
  {
    id: 'discussion-1',
    title: 'Wie seht ihr den nächsten Spieltag?',
    context: 'Bundesliga',
    replies: 84,
    lastActivity: 'vor 6 Min.',
  },
  {
    id: 'discussion-2',
    title: 'Transfergerüchte und Kaderplanung',
    context: 'Transfermarkt',
    replies: 137,
    lastActivity: 'vor 12 Min.',
  },
  {
    id: 'discussion-3',
    title: 'Sturm 2026/27 – der Saisonthread',
    context: 'SK Sturm Graz',
    replies: 263,
    lastActivity: 'vor 18 Min.',
  },
];
