import type { ReactNode } from 'react';

export const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
export const sentryEnabled = false;

export function wrapRootLayout<T extends () => ReactNode>(component: T) {
  return component;
}
