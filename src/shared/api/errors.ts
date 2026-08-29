import axios from 'axios';
import { ApiError, ApiErrorDetails } from './dto/errors';

type ErrorPayload = {
  detail?: unknown;
  message?: unknown;
  code?: unknown;
  error_code?: unknown;
};

const SAFE_DETAIL_KEYS = new Set([
  'code',
  'detail',
  'error',
  'errors',
  'field',
  'loc',
  'message',
  'msg',
  'type',
]);

function redact(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(
      /\b(access_token|refresh_token|token|password|clave)\s*[:=]\s*["']?[^,\s}"']+/gi,
      '$1=[redacted]'
    );
}

function sanitizeDetails(value: unknown): ApiErrorDetails | undefined {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value as ApiErrorDetails;
  }
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeDetails(item))
      .filter((item): item is ApiErrorDetails => item !== undefined);
  }
  if (typeof value === 'object') {
    const safeEntries = Object.entries(value).filter(([key]) =>
      SAFE_DETAIL_KEYS.has(key.toLowerCase())
    );
    if (!safeEntries.length) return undefined;
    const result: Record<string, ApiErrorDetails> = {};
    for (const [key, item] of safeEntries) {
      const safe = sanitizeDetails(item);
      if (safe !== undefined) result[key] = safe;
    }
    return Object.keys(result).length ? result : undefined;
  }
  return undefined;
}

function messagesFromDetail(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [redact(value.trim())];
  if (Array.isArray(value)) {
    return value.flatMap((item) => messagesFromDetail(item));
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = ['message', 'msg', 'detail', 'error', 'errors'];
    const preferredMessages = preferred.flatMap((key) =>
      messagesFromDetail(record[key])
    );
    if (preferredMessages.length) return preferredMessages;

    return Object.entries(record)
      .filter(([key]) => SAFE_DETAIL_KEYS.has(key.toLowerCase()))
      .flatMap(([, item]) => messagesFromDetail(item));
  }
  return [];
}

function payloadMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string' && payload.trim()) return redact(payload.trim());
  if (!payload || typeof payload !== 'object') return undefined;

  const record = payload as ErrorPayload;
  const direct = messagesFromDetail(record.detail);
  if (direct.length) return direct.join('. ');
  const message = messagesFromDetail(record.message);
  return message.length ? message.join('. ') : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  const axiosError = axios.isAxiosError(error) ? error : undefined;
  const errorRecord =
    error && typeof error === 'object'
      ? (error as {
          response?: { status?: number; data?: unknown };
          code?: string;
          message?: string;
        })
      : undefined;
  const response = axiosError?.response ?? errorRecord?.response;
  const payload = response?.data;
  const message =
    payloadMessage(payload) ??
    (typeof error === 'string' ? redact(error) : undefined) ??
    (response
      ? `La solicitud no pudo completarse (${response.status ?? 'desconocido'}).`
      : axiosError
        ? 'No se pudo conectar con el servidor.'
        : errorRecord?.message
          ? redact(errorRecord.message)
          : error instanceof Error
            ? redact(error.message)
            : 'Ocurrió un error inesperado.');

  const payloadRecord =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as ErrorPayload)
      : undefined;
  const details =
    payloadRecord?.detail !== undefined
      ? sanitizeDetails(payloadRecord.detail)
      : undefined;
  const code =
    typeof payloadRecord?.code === 'string'
      ? payloadRecord.code
      : typeof payloadRecord?.error_code === 'string'
        ? payloadRecord.error_code
        : axiosError?.code;

  return new ApiError({
    message: message || 'Ocurrió un error inesperado.',
    status: response?.status,
    code: code ?? errorRecord?.code,
    details,
  });
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado.'
): string {
  const normalized = normalizeApiError(error);
  return normalized.message || fallback;
}

export { ApiError };
