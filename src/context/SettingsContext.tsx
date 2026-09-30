import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Settings } from '../types';
import { PLACES } from '../lib/data';

const KEY = 'sahayak.settings.v1';

const DEFAULTS: Settings = {
  lang: 'hi-IN',
  theme: 'light',
  contrast: 'normal',
  font: 'default',
  motion: 'full',
  scale: 1,
  autoSpeak: false,
  showTrace: true,
  simpleLanguage: false,
  place: PLACES[0],
  devMode: false,
  routerEngine: 'auto',
  persona: 'family',
  profile: {},
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

interface Ctx {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  // Persist, and reflect every preference onto <html> so CSS does the work.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* private browsing — preferences just do not persist */
    }
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.contrast = settings.contrast;
    root.dataset.font = settings.font;
    root.dataset.motion = settings.motion === 'reduced' ? 'reduced' : 'full';
    root.style.setProperty('--app-scale', String(settings.scale));
    root.lang = settings.lang;
  }, [settings]);

  // Adopt the OS reduced-motion preference on first load.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setSettings((p) => (p.motion === 'full' ? { ...p, motion: 'reduced' } : p));
  }, []);

  const value = useMemo(() => ({ settings, set, reset }), [settings, set, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
