import { Preferences } from '@capacitor/preferences';
import { currentPlatform } from './platform';

/**
 * The user's own Sarvam key, for the native shells only.
 *
 * - desktop: stored by the Electron main process, encrypted with the OS
 *   credential store (safeStorage / DPAPI). The renderer only learns whether
 *   one exists.
 * - android: stored in app-private SharedPreferences via @capacitor/preferences
 *   (not readable by other apps on a non-rooted phone). It must be read here
 *   because the phone calls Sarvam directly.
 *
 * The web build never stores a key: the proxy's .env holds it.
 */
const PREF = 'sahayak.sarvamKey';

export interface KeyStatus {
  configured: boolean;
  /** true when the store is OS-encrypted (desktop safeStorage). */
  encrypted: boolean;
}

export async function getKeyStatus(): Promise<KeyStatus> {
  const p = currentPlatform();
  if (p === 'desktop') return window.sahayakDesktop!.keyStatus();
  if (p === 'android') {
    const { value } = await Preferences.get({ key: PREF });
    return { configured: Boolean(value), encrypted: false };
  }
  return { configured: false, encrypted: false };
}

export async function saveKey(key: string): Promise<KeyStatus> {
  const trimmed = key.trim();
  if (!/^[A-Za-z0-9_\-.]{16,200}$/.test(trimmed)) {
    throw new Error('That does not look like a Sarvam API key.');
  }
  const p = currentPlatform();
  if (p === 'desktop') return window.sahayakDesktop!.setKey(trimmed);
  if (p === 'android') {
    await Preferences.set({ key: PREF, value: trimmed });
    return { configured: true, encrypted: false };
  }
  throw new Error('Key entry is only available in the desktop and Android apps.');
}

export async function clearKey(): Promise<KeyStatus> {
  const p = currentPlatform();
  if (p === 'desktop') return window.sahayakDesktop!.clearKey();
  if (p === 'android') await Preferences.remove({ key: PREF });
  return { configured: false, encrypted: false };
}

/** Android only: the raw key for a direct upstream call. */
export async function readAndroidKey(): Promise<string> {
  const { value } = await Preferences.get({ key: PREF });
  return value ?? '';
}
