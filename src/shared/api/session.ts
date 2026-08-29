import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userId: 'user_id',
} as const;

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  userId: string;
};

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.userId);
}

export async function saveSession(session: SessionTokens): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accessToken, session.accessToken);
  await SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken);
  await SecureStore.setItemAsync(KEYS.userId, session.userId);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.accessToken);
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
  await SecureStore.deleteItemAsync(KEYS.userId);
}

export async function hasStoredSession(): Promise<boolean> {
  const [token, userId] = await Promise.all([getAccessToken(), getUserId()]);
  return Boolean(token && userId);
}
