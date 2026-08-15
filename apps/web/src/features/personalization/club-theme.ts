export interface ClubThemeInput {
  color1Hex: string;
  color1Rgba: string;
  color2Hex: string | null;
  color2Rgba: string | null;
  color3Hex: string | null;
  color3Rgba: string | null;
  accentColorHex: string | null;
  accentColorRgba: string | null;
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

export interface ClubTheme {
  color1: string;
  color1Rgba: string;
  color2: string | null;
  color2Rgba: string | null;
  color3: string | null;
  color3Rgba: string | null;
  accent: string;
  accentRgba: string;
  onColor1: string;
  onColor2: string | null;
  onColor3: string | null;
  onAccent: string;
  logo: {
    url: string | null;
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
    mimeType: string;
    source: string | null;
    sourceUrl: string | null;
    copyright: string | null;
  } | null;
}

export type ClubThemeCssProperties = Record<
  | '--kf-club-color-1'
  | '--kf-club-color-1-rgba'
  | '--kf-club-color-2'
  | '--kf-club-color-2-rgba'
  | '--kf-club-color-3'
  | '--kf-club-color-3-rgba'
  | '--kf-club-accent'
  | '--kf-club-accent-rgba'
  | '--kf-club-on-color-1'
  | '--kf-club-on-color-2'
  | '--kf-club-on-color-3'
  | '--kf-club-on-accent',
  string
>;

const DEFAULT_COLOR_1 = '#171717';
const DEFAULT_COLOR_1_RGBA = 'rgba(23, 23, 23, 1)';

const BLACK = '#000000';
const WHITE = '#FFFFFF';

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const RGBA_COLOR_PATTERN =
  /^rgba\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:0|1|0?\.\d+)\s*\)$/i;

function normalizeHexColor(value: string | null, fallback: string | null): string | null {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();

  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
}

function normalizeRgbaColor(value: string | null, fallback: string | null): string | null {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();

  return RGBA_COLOR_PATTERN.test(normalized) ? normalized : fallback;
}

function hexToRgb(color: string): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;

  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string): number {
  const [red, green, blue] = hexToRgb(color);

  return (
    0.2126 * srgbChannelToLinear(red) +
    0.7152 * srgbChannelToLinear(green) +
    0.0722 * srgbChannelToLinear(blue)
  );
}

function getContrastRatio(first: string, second: string): number {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);

  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor: string): string {
  const normalized = normalizeHexColor(backgroundColor, DEFAULT_COLOR_1) ?? DEFAULT_COLOR_1;

  const blackContrast = getContrastRatio(normalized, BLACK);
  const whiteContrast = getContrastRatio(normalized, WHITE);

  return blackContrast >= whiteContrast ? BLACK : WHITE;
}

export function resolveClubTheme(input: ClubThemeInput): ClubTheme {
  const color1 = normalizeHexColor(input.color1Hex, DEFAULT_COLOR_1) ?? DEFAULT_COLOR_1;
  const color1Rgba =
    normalizeRgbaColor(input.color1Rgba, DEFAULT_COLOR_1_RGBA) ?? DEFAULT_COLOR_1_RGBA;

  const color2 = normalizeHexColor(input.color2Hex, null);
  const color2Rgba = normalizeRgbaColor(input.color2Rgba, null);

  const color3 = normalizeHexColor(input.color3Hex, null);
  const color3Rgba = normalizeRgbaColor(input.color3Rgba, null);

  const accent = normalizeHexColor(input.accentColorHex, color1) ?? color1;
  const accentRgba = normalizeRgbaColor(input.accentColorRgba, color1Rgba) ?? color1Rgba;

  return {
    color1,
    color1Rgba,
    color2,
    color2Rgba,
    color3,
    color3Rgba,
    accent,
    accentRgba,
    onColor1: getReadableTextColor(color1),
    onColor2: color2 ? getReadableTextColor(color2) : null,
    onColor3: color3 ? getReadableTextColor(color3) : null,
    onAccent: getReadableTextColor(accent),
    logo: input.logo
      ? {
          url: input.logo.externalUrl,
          externalUrl: input.logo.externalUrl,
          storageKey: input.logo.storageKey,
          altText: input.logo.altText,
          mimeType: input.logo.mimeType,
          source: input.logo.source,
          sourceUrl: input.logo.sourceUrl,
          copyright: input.logo.copyright,
        }
      : null,
  };
}

export function clubThemeToCssProperties(theme: ClubTheme): ClubThemeCssProperties {
  return {
    '--kf-club-color-1': theme.color1,
    '--kf-club-color-1-rgba': theme.color1Rgba,
    '--kf-club-color-2': theme.color2 ?? 'transparent',
    '--kf-club-color-2-rgba': theme.color2Rgba ?? 'rgba(0, 0, 0, 0)',
    '--kf-club-color-3': theme.color3 ?? 'transparent',
    '--kf-club-color-3-rgba': theme.color3Rgba ?? 'rgba(0, 0, 0, 0)',
    '--kf-club-accent': theme.accent,
    '--kf-club-accent-rgba': theme.accentRgba,
    '--kf-club-on-color-1': theme.onColor1,
    '--kf-club-on-color-2': theme.onColor2 ?? 'currentColor',
    '--kf-club-on-color-3': theme.onColor3 ?? 'currentColor',
    '--kf-club-on-accent': theme.onAccent,
  };
}
