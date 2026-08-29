/**
 * Single source of truth for public env config.
 * Override with EXPO_PUBLIC_API_URL in `.env` (see `.env.template`).
 */
const DEFAULT_API_URL = 'https://tobaratoapi.alirizvi.dev/api/';

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_API_URL;
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export const env = {
  apiUrl: normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL
  ),
} as const;

export { DEFAULT_API_URL };
