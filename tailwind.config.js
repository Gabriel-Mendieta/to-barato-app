/**
 * `tailwind-tokens.cjs` is generated from the canonical TypeScript tokens.
 * Run `yarn tokens:sync` after changing tokens.ts; Tailwind's Node config then
 * works on the Node 22.13 version used by CI without a duplicate source.
 */
const {
  colors,
  darkColors,
  spacing,
  radii,
  typography,
} = require('./src/shared/theme/tailwind-tokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: colors.navy,
        'navy-2': colors.navy2,
        'navy-soft': colors.navySoft,
        ink: colors.ink,
        muted: colors.muted,
        line: colors.line,
        background: colors.bg,
        card: colors.card,
        orange: colors.orange,
        'orange-soft': colors.orangeSoft,
        'orange-deep': colors.orangeDeep,
        green: colors.green,
        'green-soft': colors.greenSoft,
        red: colors.red,
        'red-soft': colors.redSoft,
        'blue-soft': colors.blueSoft,
        'lilac-soft': colors.lilacSoft,
        'tab-inactive': colors.tabInactive,
        dark: Object.fromEntries(
          Object.entries(darkColors).map(([name, value]) => [
            name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
            value,
          ]),
        ),
      },
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([name, value]) => [name, `${value}px`]),
      ),
      borderRadius: Object.fromEntries(
        Object.entries(radii).map(([name, value]) => [name, `${value}px`]),
      ),
      fontSize: Object.fromEntries(
        Object.entries(typography.sizes).map(([name, value]) => [name, `${value}px`]),
      ),

      fontFamily: {
        jakarta: [typography.family, 'sans-serif'],
        sans: [typography.family, 'sans-serif'],
      },
    },
  },
  plugins: [],
};
