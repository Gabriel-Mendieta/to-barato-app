import * as Sentry from '@sentry/react-native';
import type { ReactNode } from 'react';

const SENSITIVE_KEY = /password|clave|token|authorization|cookie|secret|otp|codigo/i;
const FILTERED = '[Filtered]';

function redact(value: unknown, key = ''): unknown {
  if (SENSITIVE_KEY.test(key)) return FILTERED;
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }
  if (typeof value === 'string' && SENSITIVE_KEY.test(value)) return FILTERED;
  return value;
}

function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return redact(record) as Record<string, unknown>;
}

function isValidDsn(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
export const sentryEnabled = isValidDsn(sentryDsn);

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    sendDefaultPii: false,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
    beforeSend(event) {
      if (event.extra) event.extra = redactRecord(event.extra);
      if (event.contexts) {
        Object.keys(event.contexts).forEach((key) => {
          if (SENSITIVE_KEY.test(key)) delete event.contexts?.[key];
        });
      }
      if (event.request?.data) {
        event.request.data = redact(event.request.data);
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          message: breadcrumb.message ? String(redact(breadcrumb.message)) : breadcrumb.message,
          data: breadcrumb.data ? redactRecord(breadcrumb.data) : breadcrumb.data,
        }));
      }
      return event;
    },
  });
}

export function wrapRootLayout<T extends () => ReactNode>(component: T) {
  return Sentry.wrap(component);
}
