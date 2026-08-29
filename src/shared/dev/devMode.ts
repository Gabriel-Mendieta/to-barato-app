import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'dev_offline_mode';

let offlineMode = false;
let initialized = false;

export function isOfflineMode(): boolean {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return false;
  return offlineMode;
}

export async function setOfflineMode(value: boolean): Promise<void> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  offlineMode = value;
  await SecureStore.setItemAsync(STORAGE_KEY, value ? '1' : '0');
}

export async function initDevMode(): Promise<void> {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || initialized) return;
  initialized = true;
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    offlineMode = stored === '1';
  } catch {
    offlineMode = false;
  }
}

/** Resets in-memory state — for tests only. */
export function __resetDevModeForTests(): void {
  offlineMode = false;
  initialized = false;
}
