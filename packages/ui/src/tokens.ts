export const DESIGN_TOKENS = {
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  icons: {
    sizes: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
    strokeWidth: 2,
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
export type DesignBreakpoint = keyof typeof DESIGN_TOKENS.breakpoints;
export type DesignIconSize = keyof typeof DESIGN_TOKENS.icons.sizes;
