import { useState } from 'react';
import type { PersonaId } from '../../types';
import { MONTHS, eventsFor } from '../../dashboard/calendar';
import type { SeasonEvent } from '../../dashboard/calendar';
import { bi } from '../../dashboard/personas';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';

const TONE: Record<SeasonEvent['tone'], string> = {
  act: 'bg-danger',
  money: 'bg-ok',
  info: 'bg-brand',
};

/**
 * Twelve-month strip. Each month is a real button; choosing one lists what
 * happens then. Dots are decorative — the list below says it in words.
 */
export function SeasonCalendar({ persona, now = new Date() }: { persona: PersonaId; now?: Date }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const lang = settings.lang;
  const events = eventsFor(persona);
  const current = now.getMonth();
  const [month, setMonth] = useState(current);

  if (events.length === 0) return null;
  const inMonth = events.filter((e) => e.months.includes(month));

  return (
    <section aria-labelledby="cal-heading" className="card p-4">
      <h2 id="cal-heading" className="font-bold flex items-center gap-2">
        <span aria-hidden="true">🗓️</span>
        {s('calendar')}
      </h2>
      <p className="text-xs text-muted mt-0.5">{s('usually')}</p>

      <div className="mt-3 grid grid-cols-6 sm:grid-cols-12 gap-1" role="group" aria-label={s('calendar')}>
        {MONTHS.map((m, i) => {
          const dots = events.filter((e) => e.months.includes(i));
          const selected = i === month;
          return (
            <button
              key={m.en}
              type="button"
              aria-pressed={selected}
              aria-label={`${m.en}${i === current ? `, ${s('thisMonth')}` : ''}, ${dots.length}`}
              onClick={() => setMonth(i)}
              className={[
                'min-h-[52px] rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors',
                selected ? 'bg-brand text-brandInk border-brand' : 'border-line hover:bg-surface',
                i === current && !selected ? 'ring-2 ring-brand/50' : '',
              ].join(' ')}
            >
              {bi(m, lang)}
              <span aria-hidden="true" className="flex gap-0.5">
                {dots.slice(0, 3).map((d) => (
                  <span key={d.id} className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-brandInk' : TONE[d.tone]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 space-y-2" role="list" aria-live="polite">
        {inMonth.length === 0 ? (
          <li className="text-sm text-muted">—</li>
        ) : (
          inMonth.map((e) => (
            <li key={e.id} className="flex gap-2 text-sm">
              <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[e.tone]}`} />
              <span>
                <strong>{bi(e.label, lang)}</strong> — {bi(e.detail, lang)}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
