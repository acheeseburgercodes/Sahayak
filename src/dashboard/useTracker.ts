import { useCallback, useEffect, useState } from 'react';
import type { DocId } from './schemes';

export type TrackStatus = 'planning' | 'applied' | 'received';

export interface TrackEntry {
  status: TrackStatus;
  /** Documents the person has ticked as ready. */
  have: DocId[];
  addedAt: number;
}

export type Tracker = Record<string, TrackEntry>;

const KEY = 'sahayak.tracker.v1';

function load(): Tracker {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tracker) : {};
  } catch {
    return {};
  }
}

/** Application tracker, persisted on this device only. */
export function useTracker() {
  const [tracker, setTracker] = useState<Tracker>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tracker));
    } catch {
      /* private browsing: the tracker just does not persist */
    }
  }, [tracker]);

  const toggle = useCallback((id: string) => {
    setTracker((prev) => {
      if (prev[id]) {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: { status: 'planning', have: [], addedAt: Date.now() } };
    });
  }, []);

  const toggleDoc = useCallback((id: string, doc: DocId) => {
    setTracker((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      const have = entry.have.includes(doc) ? entry.have.filter((d) => d !== doc) : [...entry.have, doc];
      return { ...prev, [id]: { ...entry, have } };
    });
  }, []);

  const setStatus = useCallback((id: string, status: TrackStatus) => {
    setTracker((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], status } } : prev));
  }, []);

  return { tracker, toggle, toggleDoc, setStatus };
}
