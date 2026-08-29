import axios, {
  AxiosAdapter,
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { isOfflineMode } from '../dev/devMode';
import { resolveMockRequest } from '../dev/mockRouter';
import { endpoints } from './endpoints';
import { normalizeApiError } from './errors';
import type { RefreshResponse } from './dto';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
  getUserId,
} from './session';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function rotateAccessToken(client: AxiosInstance): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  const userId = await getUserId();
  if (!refreshToken) return null;

  try {
    const { data } = await client.get<RefreshResponse>(endpoints.refresh, {
      // The refresh endpoint authenticates with the refresh token itself.
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    const access = data.tokens?.access_token ?? data.access_token ?? data.token ?? null;
    const nextRefresh = data.tokens?.refresh_token ?? refreshToken;

    if (!access || !userId) return null;

    await saveSession({
      accessToken: access,
      refreshToken: nextRefresh,
      userId,
    });
    return access;
  } catch {
    await clearSession();
    return null;
  }
}

function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    const explicitAuthorization =
      config.headers?.Authorization ?? config.headers?.authorization;
    if (token && !explicitAuthorization) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const original = error.config as RetriableConfig | undefined;

      if (!original || status !== 401 || original._retry) {
        return Promise.reject(normalizeApiError(error));
      }

      // Do not try to refresh the refresh call.
      const url = original.url ?? '';
      if (url.includes(endpoints.refresh) || url.includes(endpoints.login)) {
        return Promise.reject(normalizeApiError(error));
      }

      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = rotateAccessToken(client).finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (!newToken) {
        return Promise.reject(normalizeApiError(error));
      }

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return client.request(original);
    }
  );
}

const defaultAdapter = axios.getAdapter(axios.defaults.adapter);

function createDevAwareAdapter(): AxiosAdapter {
  return async (config) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__ && isOfflineMode()) {
      return resolveMockRequest(config);
    }
    return defaultAdapter(config);
  };
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  adapter: createDevAwareAdapter(),
});

attachInterceptors(api);

export default api;
