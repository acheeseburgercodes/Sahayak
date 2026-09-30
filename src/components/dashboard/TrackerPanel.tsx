import { useId } from 'react';
import { SCHEME_BY_ID } from '../../dashboard/schemes';
import type { Tracker, TrackStatus } from '../../dashboard/useTracker';
import { bi } from '../../dashboard/personas';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';
import type { UiKey } from '../../i18n/strings';

const STATUSES: Array<[TrackStatus, UiKey]> = [
  ['planning', 'statusPlanning'],
  ['applied', 'statusApplied'],
  ['received', 'statusReceived'],
];

interface Props {
  tracker: Tracker;
  onStatus: (id: string, status: TrackStatus) => void;
  onRemove: (id: string) => void;
  onJump: (id: string) => void;
}

/** "My applications": documents-ready progress and a status per tracked scheme. */
export function TrackerPanel({ tracker, onStatus, onRemove, onJump }: Props) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const base = useId();
  const entries = Object.entries(tracker)
    .filter(([id]) => SCHEME_BY_ID[id])
    .sort((a, b) => a[1].addedAt - b[1].addedAt);

  return (
    <section aria-labelledby="tracker-heading" className="card p-4">
      <h2 id="tracker-heading" className="font-bold flex items-center gap-2">
        <span aria-hidden="true">★</span>
        {s('tracker')}
        {entries.length > 0 && <span className="chip">{entries.length}</span>}
      </h2>

      {entries.length === 0 ? (
        <p className="text-sm text-muted mt-2">{s('trackerEmpty')}</p>
      ) : (
        <ul className="mt-3 space-y-3" role="list">
          {entries.map(([id, entry]) => {
            const scheme = SCHEME_BY_ID[id];
            const total = scheme.docs.length;
            const done = entry.have.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const selId = `${base}-${id}`;
            return (
              <li key={id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <button type="button" className="font-semibold text-start underline-offset-2 hover:underline min-h-[36px] me-auto" onClick={() => onJump(id)}>
                    {bi(scheme.name, settings.lang)}
                  </button>
                  <button type="button" className="icon-btn !h-9 !w-9 text-sm" onClick={() => onRemove(id)} aria-label={`${s('remove')}: ${bi(scheme.name, settings.lang)}`}>
                    ✕
                  </button>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                  aria-label={`${done}/${total} ${s('docsReady')}`}
                  className="mt-1 h-2 rounded-full bg-line/60 overflow-hidden"
                >
                  <div className="h-full bg-ok transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-muted me-auto">
                    {done}/{total} {s('docsReady')}
                  </span>
                  <label htmlFor={selId} className="sr-only-focusable">
                    {bi(scheme.name, settings.lang)}
                  </label>
                  <select
                    id={selId}
                    className="field !w-auto !min-h-[40px] text-xs"
                    value={entry.status}
                    onChange={(e) => onStatus(id, e.target.value as TrackStatus)}
                  >
                    {STATUSES.map(([v, key]) => (
                      <option key={v} value={v}>
                        {s(key)}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
