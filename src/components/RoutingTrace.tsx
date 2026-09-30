import type { RoutingDecision } from '../types';
import { AGENTS } from '../agents/registry';
import { SUB_AGENTS } from '../agents/subAgents';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

const URGENCY_TONE: Record<RoutingDecision['urgency'], string> = {
  routine: 'text-muted',
  'time-sensitive': 'text-warn',
  emergency: 'text-danger font-bold',
};

function Bar({ value, max = 11 }: { value: number; max?: number }) {
  return (
    <span className="h-1.5 flex-1 rounded-full bg-line/60 overflow-hidden" aria-hidden="true">
      <span className="block h-full bg-brand/70" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </span>
  );
}

/**
 * Routing transparency, quiet by default: one line saying who answers and
 * why-on-demand. Developer mode adds the full scoring, the sub-router and the
 * planner's split.
 */
export function RoutingTrace({ routing }: { routing: RoutingDecision }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const dev = settings.devMode;
  const primary = AGENTS[routing.primary];
  const sub = routing.subAgent ? SUB_AGENTS[routing.subAgent] : undefined;
  const top = routing.scores.filter((x) => x.score > 0).slice(0, dev ? 6 : 3);
  const conf = Math.round(routing.confidence * 100);

  return (
    <details className="group text-xs text-muted" aria-label={s('whyThis')}>
      <summary className="cursor-pointer list-none inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 min-h-[32px] hover:text-ink">
        <span aria-hidden="true">↳</span>
        <span>{s('routedTo')}</span>
        <span className="font-semibold text-ink">{primary.name}</span>
        {sub && <span>› {sub.name}</span>}
        {routing.collaborators.length > 0 && (
          <span>
            + {routing.collaborators.map((c) => AGENTS[c].name).join(', ')}
          </span>
        )}
        {routing.plan && routing.plan.length > 0 && (
          <span>
            ⇉ {routing.plan.map((p) => AGENTS[p.agent].name).join(' · ')}
          </span>
        )}
        {routing.urgency !== 'routine' && (
          <span className={URGENCY_TONE[routing.urgency]}>· {routing.urgency}</span>
        )}
        <span className="underline decoration-dotted underline-offset-2 group-open:hidden">
          {s('whyThis')}
        </span>
      </summary>

      <div className="mt-2 mb-1 rounded-lg border border-line bg-panel p-3 space-y-3 text-ink">
        <p>{routing.rationale}</p>

        <div className="flex items-center gap-2">
          <span className="w-20 text-muted">{s('confidence')}</span>
          <span
            className="h-1.5 flex-1 rounded-full bg-line/60 overflow-hidden"
            role="meter"
            aria-valuenow={conf}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={s('confidence')}
          >
            <span className="block h-full bg-brand" style={{ width: `${conf}%` }} />
          </span>
          <span className="font-mono w-10 text-end">{conf}%</span>
        </div>

        {top.length > 0 && (
          <ul className="space-y-1" role="list" aria-label="Teammate scores">
            {top.map((x) => (
              <li key={x.agent} className="flex items-center gap-2">
                <span className="w-24 truncate">{AGENTS[x.agent].name}</span>
                <Bar value={x.score} />
                <span className="font-mono text-muted w-8 text-end">{x.score.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}

        {dev && routing.subScores && routing.subScores.length > 0 && (
          <div>
            <p className="font-semibold mb-1">
              Sub-router <code className="text-muted">({routing.subEngine})</code>
            </p>
            <ul className="space-y-1" role="list" aria-label="Sub-agent scores">
              {routing.subScores.map((x) => (
                <li key={x.sub} className="flex items-center gap-2">
                  <span className={`w-36 truncate font-mono ${x.sub === routing.subAgent ? 'text-brand font-bold' : ''}`}>
                    {x.sub}
                  </span>
                  <Bar value={x.score} max={6} />
                  <span className="font-mono text-muted w-8 text-end">{x.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dev && routing.plan && routing.plan.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Planner split</p>
            <ol className="list-decimal ms-5 space-y-0.5">
              {routing.plan.map((p) => (
                <li key={p.agent}>
                  <code>{p.sub ?? p.agent}</code> ← “{p.part}”
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-muted font-mono">
          engine={routing.engine}
          {routing.detectedLanguage ? ` lang=${routing.detectedLanguage}` : ''}
          {dev ? ` urgency=${routing.urgency}` : ''}
        </p>
      </div>
    </details>
  );
}
