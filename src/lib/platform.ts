import { Capacitor } from '@capacitor/core';

/**
 * Where Sahayak is running. The same React bundle ships in three shells:
 *
 * - `web`     — browser + Vite dev server; Sarvam calls go to the Express
 *               proxy (server/proxy.mjs) through the same-origin `/sarvam`.
 * - `desktop` — Electron. The main process serves the bundle AND `/sarvam`
 *               from one loopback server, so the renderer code is identical
 *               to web. The key is held by the main process (safeStorage).
 * - `android` — Capacitor. No Node process on a phone, so Sarvam is called
 *               directly with a key the user saved on their own device.
 */
export type Platform = 'web' | 'desktop' | 'android';

export interface DesktopBridge {
  platform: 'desktop';
  version: string;
  /** Whether a Sarvam key is stored (the key itself never reaches the renderer). */
  keyStatus(): Promise<{ configured: boolean; encrypted: boolean }>;
  setKey(key: string): Promise<{ configured: boolean; encrypted: boolean }>;
  clearKey(): Promise<{ configured: boolean; encrypted: boolean }>;
  openExternal(url: string): Promise<void>;
}

declare global {
  interface Window {
    sahayakDesktop?: DesktopBridge;
  }
}

export function currentPlatform(): Platform {
  if (typeof window !== 'undefined' && window.sahayakDesktop?.platform === 'desktop') return 'desktop';
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') return 'android';
  } catch {
    /* not in a Capacitor shell */
  }
  return 'web';
}

export const isDesktop = (): boolean => currentPlatform() === 'desktop';
export const isAndroid = (): boolean => currentPlatform() === 'android';

/** Whether this shell lets the user paste their own Sarvam key in Settings. */
export const supportsKeyEntry = (): boolean => currentPlatform() !== 'web';
