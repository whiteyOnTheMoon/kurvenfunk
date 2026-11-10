/** The shipped assets are explicit; a newly created club may not have one. */
const LOCAL_LOGO_SLUGS = new Set([
  'admira-wacker',
  'ask-voitsberg',
  'fac-wien',
  'fc-blau-weiss-linz',
  'fc-hertha-wels',
  'fc-liefering',
  'fc-red-bull-salzburg',
  'fc-wacker-innsbruck',
  'first-vienna-fc-1894',
  'fk-austria-wien',
  'grazer-ak-1902',
  'ksv-1919',
  'lask',
  'sc-austria-lustenau',
  'schwarz-weiss-bregenz',
  'scr-altach',
  'sk-rapid-ii',
  'sk-rapid-wien',
  'sk-sturm-graz-ii',
  'sk-sturm-graz',
  'skn-st-poelten',
  'sku-amstetten',
  'sv-austria-salzburg',
  'sv-ried',
  'tsv-hartberg',
  'wolfsberger-ac',
  'wsg-tirol',
  'young-violets-austria-wien',
]);

export interface ClubLogoMedia {
  id: string;
  storageKey: string | null;
  externalUrl: string | null;
}

export function getClubLogoSrc(
  apiUrl: string,
  club: { slug: string; logo: ClubLogoMedia | null },
): string | null {
  if (club.logo?.storageKey && club.logo.id) {
    return `${apiUrl.replace(/\/$/, '')}/api/v1/media/${encodeURIComponent(club.logo.id)}/content`;
  }
  if (club.logo?.externalUrl && /^https?:\/\//i.test(club.logo.externalUrl)) {
    return club.logo.externalUrl;
  }
  return LOCAL_LOGO_SLUGS.has(club.slug) ? `/clubs/${club.slug}.svg` : null;
}
