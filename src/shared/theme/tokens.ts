/**
 * Design tokens from Claude Design (ToBarato.zip) — adapted for React Native.
 *
 * `lightColors` and `darkColors` are the canonical palettes. `colors` remains
 * an alias for the light palette so existing imports keep working.
 */
const lightColors = {
  navy: '#0B2545',
  navy2: '#133b6b',
  navySoft: '#19426E',
  ink: '#0F1F3A',
  muted: '#6B7385',
  line: '#E6E9F0',
  bg: '#F4F6FB',
  card: '#ffffff',
  orange: '#F2A03D',
  orangeSoft: '#FFEACB',
  orangeDeep: '#C97A1A',
  green: '#22A06B',
  greenSoft: '#DCF3E7',
  red: '#E5564E',
  redSoft: '#FFE3E1',
  blueSoft: '#E3EDFA',
  lilacSoft: '#ECE6FA',
  tabInactive: '#8A93A6',
  white: '#ffffff',
} as const;

const darkColors = {
  navy: '#9BC5F0',
  navy2: '#7EACD8',
  navySoft: '#8DB7E2',
  ink: '#F4F7FB',
  muted: '#AAB6C8',
  line: '#334155',
  bg: '#0B1424',
  card: '#142235',
  orange: '#F2A03D',
  orangeSoft: '#5A3A16',
  orangeDeep: '#FFC46B',
  green: '#5FD39A',
  greenSoft: '#153C2B',
  red: '#FF8A82',
  redSoft: '#4A211F',
  blueSoft: '#1C3654',
  lilacSoft: '#332A51',
  tabInactive: '#9AA8BB',
  white: '#FFFFFF',
} as const;

/** Backwards-compatible light palette import. */
export const colors = lightColors;
export { lightColors, darkColors };
export type ThemeColors = Readonly<Record<keyof typeof lightColors, string>>;

export function getThemeColors(colorScheme?: 'light' | 'dark' | 'unspecified' | null): ThemeColors {
  return colorScheme === 'dark' ? darkColors : lightColors;
}

/** Brand colors per supermarket / provider (IdProveedor). */
export const providerBrand: Record<number, { color: string; bg: string; label?: string }> = {
  1: { color: '#2E78B5', bg: '#DCEAF7' }, // Nacional
  2: { color: '#1B6E3F', bg: '#DCF3E5' }, // Jumbo
  3: { color: '#D63939', bg: '#FFE3E0' }, // La Sirena
  4: { color: '#C97A1A', bg: '#FFEACB' }, // Ferretería
  5: { color: '#22A06B', bg: '#DCF3E7' }, // Farmacia
  6: { color: '#7B3FB0', bg: '#EEDFFA' }, // Bravo
  7: { color: '#0046BE', bg: '#DCE5F7' }, // PriceSmart
  8: { color: '#E5564E', bg: '#FFE3E1' }, // Sirena Market
};

export function getProviderBrand(id: number) {
  return providerBrand[id] ?? { color: colors.navySoft, bg: colors.blueSoft };
}

/** Soft pastel backgrounds for product image areas by category id. */
export const categoryImageBg: Record<number, string> = {
  1: '#F0EDDC',
  2: '#EAF2FA',
  3: '#FBE0DA',
  4: '#FFF1D9',
  5: '#E3EDFA',
  6: '#E8EEF7',
  7: '#F2F8D0',
  8: '#E5F4D9',
  9: '#ECE6FA',
  10: '#FFEACB',
  11: '#DCF3E7',
  12: '#FFE3E1',
  13: '#FFE8D9',
  14: '#FFF4E0',
  15: '#F0EDDC',
};

export function getCategoryImageBg(categoriaId: number) {
  return categoryImageBg[categoriaId] ?? colors.line;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  family: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
  },
} as const;

export const layout = {
  gutter: 16,
  gutterWide: 24,
  maxContentWidth: 720,
  tabletBreakpoint: 768,
} as const;

export const theme = {
  colors,
  lightColors,
  darkColors,
  spacing,
  radii,
  typography,
  layout,
} as const;

export type Theme = typeof theme;
