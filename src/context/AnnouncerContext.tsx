import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Single polite live region for the whole app. Status changes (routing,
 * an agent starting to write, an answer arriving) are announced here so a
 * screen-reader user is not left guessing at silent DOM updates.
 */
interface Ctx {
  announce: (message: string, assertive?: boolean) => void;
}

const AnnouncerContext = createContext<Ctx | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const seq = useRef(0);

  const announce = useCallback((message: string, isAssertive = false) => {
    // The counter suffix forces a re-announcement of identical text.
    seq.current += 1;
    const text = `${message}\u200B`.repeat(1) + '\u200B'.repeat(seq.current % 2);
    if (isAssertive) setAssertive(text);
    else setPolite(text);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="sr-only-focusable" aria-live="polite" aria-atomic="true" role="status">
        {polite}
      </div>
      <div className="sr-only-focusable" aria-live="assertive" aria-atomic="true" role="alert">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): (message: string, assertive?: boolean) => void {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) throw new Error('useAnnounce must be used inside AnnouncerProvider');
  return ctx.announce;
}
