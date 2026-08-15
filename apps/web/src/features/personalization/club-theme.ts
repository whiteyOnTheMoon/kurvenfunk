export interface ClubThemeInput {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
}

export interface ClubTheme {
  primary: string;
  secondary: string;
  accent: string;
  onPrimary: string;
  onSecondary: string;
  onAccent: string;
}

export type ClubThemeCssProperties = Record<
  | '--kf-club-primary'
  | '--kf-club-secondary'
  | '--kf-club-accent'
  | '--kf-club-on-primary'
  | '--kf-club-on-secondary'
  | '--kf-club-on-accent',
  string
>;

const DEFAULT_PRIMARY = '#171717';
const DEFAULT_SECONDARY = '#FFFFFF';

const BLACK = '#000000';
const WHITE = '#FFFFFF';

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

function normalizeHexColor(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();

  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
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
  const normalized = normalizeHexColor(backgroundColor, DEFAULT_PRIMARY);

  const blackContrast = getContrastRatio(normalized, BLACK);
  const whiteContrast = getContrastRatio(normalized, WHITE);

  return blackContrast >= whiteContrast ? BLACK : WHITE;
}

export function resolveClubTheme(input: ClubThemeInput): ClubTheme {
  const primary = normalizeHexColor(input.primaryColor, DEFAULT_PRIMARY);
  const secondary = normalizeHexColor(input.secondaryColor, DEFAULT_SECONDARY);
  const accent = normalizeHexColor(input.accentColor, primary);

  return {
    primary,
    secondary,
    accent,
    onPrimary: getReadableTextColor(primary),
    onSecondary: getReadableTextColor(secondary),
    onAccent: getReadableTextColor(accent),
  };
}

export function clubThemeToCssProperties(theme: ClubTheme): ClubThemeCssProperties {
  return {
    '--kf-club-primary': theme.primary,
    '--kf-club-secondary': theme.secondary,
    '--kf-club-accent': theme.accent,
    '--kf-club-on-primary': theme.onPrimary,
    '--kf-club-on-secondary': theme.onSecondary,
    '--kf-club-on-accent': theme.onAccent,
  };
}
