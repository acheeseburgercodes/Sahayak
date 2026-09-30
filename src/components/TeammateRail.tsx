import { AGENTS, ADVANCED_ORDER, CORE_ORDER } from '../agents/registry';
import type { AgentId, ForcedRoute, WorkerId } from '../types';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

interface Props {
  activeId: AgentId | null;
  busyIds: AgentId[];
  forced: ForcedRoute | null;
  onForce: (route: ForcedRoute | null) => void;
}

/**
 * The team, as one quiet row of chips. It makes the "team of specialists"
 * model legible and lets anyone pin a teammate; picking a SUB-agent is a
 * developer-mode control and lives in the composer.
 */
export function TeammateRail({ activeId, busyIds, forced, onForce }: Props) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);

  const chip = (id: AgentId) => {
    const a = AGENTS[id];
    const pinned = forced?.agent === id;
    const busy = busyIds.includes(id);
    const active = activeId === id;
    return (
      <li key={id} className="shrink-0">
        <button
          type="button"
          aria-pressed={pinned}
          onClick={() => onForce(pinned ? null : { agent: id as WorkerId })}
          title={`${a.role} — ${a.blurb}`}
          aria-label={`${a.name}, ${a.role}${busy ? `, ${s('agentTyping')}` : ''}`}
          className={[
            'relative inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full text-sm transition-colors border',
            pinned
              ? 'bg-brand text-brandInk border-brand'
              : active
                ? 'border-brand/60 bg-panel'
                : 'border-transparent hover:bg-panel hover:border-line',
          ].join(' ')}
        >
          <span aria-hidden="true">{a.emoji}</span>
          <span className="font-semibold">{a.name}</span>
          {busy && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-brand animate-pulse"
            />
          )}
        </button>
      </li>
    );
  };

  return (
    <nav aria-labelledby="team-heading" id="teammates" className="border-b border-line/60">
      <h2 id="team-heading" className="sr-only-focusable">
        {s('teammates')}
      </h2>
      <ul
        className="mx-auto max-w-3xl px-2 flex items-center gap-0.5 overflow-x-auto thin-scroll py-1"
        role="list"
      >
        {CORE_ORDER.map(chip)}
        <li aria-hidden="true" className="shrink-0 mx-1 h-5 w-px bg-line" />
        <li className="shrink-0 text-[0.7rem] font-bold uppercase tracking-wide text-muted px-1">
          {s('advanced')}
        </li>
        {ADVANCED_ORDER.map(chip)}
      </ul>
    </nav>
  );
}
