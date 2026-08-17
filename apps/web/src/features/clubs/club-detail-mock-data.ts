import {
  clubLastMatch,
  clubNews,
  clubNextMatch,
  discussions,
  standings,
  type MockArticle,
  type MockDiscussion,
  type MockMatch,
  type MockStandingRow,
} from '../personalization/startpage-mock-data';

interface ClubIdentity {
  name: string;
  shortName: string | null;
  slug: string;
}

export interface ClubPageMockData {
  news: MockArticle[];
  nextMatch: MockMatch | null;
  lastMatch: MockMatch | null;
  standings: MockStandingRow[];
  discussions: MockDiscussion[];
}

export function getClubPageMockData(club: ClubIdentity): ClubPageMockData {
  const clubName = club.shortName ?? club.name;

  if (club.slug === 'sk-sturm-graz') {
    return {
      news: clubNews,
      nextMatch: clubNextMatch,
      lastMatch: clubLastMatch,
      standings,
      discussions,
    };
  }

  return {
    news: [
      {
        id: `${club.slug}-news-1`,
        category: clubName,
        title: `Aktuelles rund um ${clubName}`,
        lead: `Hier erscheinen künftig die neuesten Meldungen, Analysen und Hintergründe zu ${club.name}.`,
        time: 'Demo',
        featured: true,
      },
      {
        id: `${club.slug}-news-2`,
        category: 'Mannschaft',
        title: `Mannschaft und sportliche Entwicklung bei ${clubName}`,
        lead: 'Kadernews, sportliche Entwicklungen und Stimmen aus dem Vereinsumfeld werden hier gebündelt.',
        time: 'Demo',
      },
      {
        id: `${club.slug}-news-3`,
        category: 'Verein',
        title: `Alles Wichtige aus dem Verein`,
        lead: `Neuigkeiten abseits des Spielfelds und Themen aus dem Umfeld von ${club.name}.`,
        time: 'Demo',
      },
    ],
    nextMatch: null,
    lastMatch: null,
    standings,
    discussions: [
      {
        id: `${club.slug}-discussion-1`,
        title: `${clubName} 2026/27 – der Saisonthread`,
        context: club.name,
        replies: 0,
        lastActivity: 'Noch keine Beiträge',
      },
      {
        id: `${club.slug}-discussion-2`,
        title: 'Kader, Transfers und Gerüchte',
        context: clubName,
        replies: 0,
        lastActivity: 'Noch keine Beiträge',
      },
      {
        id: `${club.slug}-discussion-3`,
        title: 'Rund um den Verein',
        context: clubName,
        replies: 0,
        lastActivity: 'Noch keine Beiträge',
      },
    ],
  };
}
