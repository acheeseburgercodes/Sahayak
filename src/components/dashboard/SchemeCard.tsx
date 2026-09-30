import { motion } from 'motion/react';
import { MagicCard } from '@/components/ui/magic-card';
import type { ForcedRoute } from '../../types';
import type { Scheme, Verdict, VerdictStatus } from '../../dashboard/schemes';
import { CATEGORY_LABEL, DOCS } from '../../dashboard/schemes';
import type { TrackEntry } from '../../dashboard/useTracker';
import { bi } from '../../dashboard/personas';
import { AGENTS } from '../../agents/registry';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';
import type { UiKey } from '../../i18n/strings';

export type AskFn = (text: string, route: ForcedRoute) => void;

/** Status is carried by an icon AND words, never by colour alone. */
const BADGE: Record<VerdictStatus, { icon: string; key: UiKey; cls: string }> = {
  likely: { icon: '✓', key: 'likely', cls: 'text-ok border-ok/50 bg-ok/10' },
  check: { icon: '?', key: 'check', cls: 'text-warn border-warn/50 bg-warn/10' },
  no: { icon: '✕', key: 'notEligible', cls: 'text-muted border-line bg-surface' },
};

interface Props {
  scheme: Scheme;
  verdict: Verdict;
  entry?: TrackEntry;
  onAsk: AskFn;
  onToggleTrack: (id: string) => void;
  onToggleDoc: (id: string, doc: TrackEntry['have'][number]) => void;
}

export function SchemeCard({ scheme, verdict, entry, onAsk, onToggleTrack, onToggleDoc }: Props) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const lang = settings.lang;
  const hi = lang === 'hi-IN';
  const badge = BADGE[verdict.status];
  const cat = CATEGORY_LABEL[scheme.category];
  const owner = AGENTS[scheme.agent];
  const name = bi(scheme.name, lang);
  const headingId = `scheme-${scheme.id}`;

  const ask = () =>
    onAsk(
      hi
        ? `${scheme.name.hi}: क्या मैं पात्र हूँ, कौन से कागज़ चाहिए, और आवेदन कैसे करूँ?`
        : `${scheme.name.en}: am I eligible, which documents do I need, and how do I apply?`,
      { agent: scheme.agent, sub: scheme.sub, origin: 'dashboard', label: scheme.name.en },
    );

  return (
    <MagicCard className="w-full">
    <article
      id={`card-${scheme.id}`}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="p-4 flex flex-col gap-3 h-full rounded-xl focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-xl leading-none mt-0.5">
          {cat.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={headingId} className="font-bold leading-snug">
            {name}
          </h3>
          <p className="text-xs text-muted">{bi(cat, lang)}</p>
        </div>
        <span className={`chip shrink-0 ${badge.cls}`}>
          <span aria-hidden="true">{badge.icon}</span>
          {s(badge.key)}
        </span>
      </div>

      <p className="text-sm leading-relaxed">{bi(scheme.benefit, lang)}</p>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted min-h-[32px] inline-flex items-center">{s('whyVerdict')}</summary>
        <ul className="mt-1 ms-4 list-disc space-y-0.5">
          {verdict.reasons.map((reason) => (
            <li key={reason.en}>{bi(reason, lang)}</li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted">{s('eligibilityNote')}</p>
      </details>

      <details className="text-sm" open={Boolean(entry)}>
        <summary className="cursor-pointer text-muted min-h-[32px] inline-flex items-center">
          {s('documentsNeeded')} ({entry ? `${entry.have.length}/${scheme.docs.length}` : scheme.docs.length})
        </summary>
        <ul className="mt-1 space-y-1" role="list">
          {scheme.docs.map((doc) => {
            const label = bi(DOCS[doc], lang);
            if (!entry) {
              return (
                <li key={doc} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  {label}
                </li>
              );
            }
            const id = `${scheme.id}-doc-${doc}`;
            return (
              <li key={doc}>
                <label htmlFor={id} className="flex items-center gap-2 min-h-[36px] cursor-pointer">
                  <input
                    id={id}
                    type="checkbox"
                    className="h-5 w-5 accent-[rgb(var(--c-brand))]"
                    checked={entry.have.includes(doc)}
                    onChange={() => onToggleDoc(scheme.id, doc)}
                  />
                  <span className={entry.have.includes(doc) ? 'line-through text-muted' : ''}>{label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className="btn btn-primary" onClick={ask}>
          <span aria-hidden="true">{owner.emoji}</span>
          {s('askAssistant')}
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={Boolean(entry)}
          onClick={() => onToggleTrack(scheme.id)}
          aria-label={`${entry ? s('tracking') : s('track')}: ${name}`}
        >
          <motion.span
            aria-hidden="true"
            key={entry ? 'on' : 'off'}
            initial={{ scale: 0.4, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className={entry ? 'text-warn' : ''}
          >
            {entry ? '★' : '☆'}
          </motion.span>
          {entry ? s('tracking') : s('track')}
        </button>
        {scheme.url && (
          <a
            href={scheme.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn !border-transparent underline underline-offset-2 text-sm"
          >
            {s('officialSite')}
            <span aria-hidden="true">↗</span>
            <span className="sr-only-focusable"> (opens in a new tab)</span>
          </a>
        )}
        {scheme.helpline && (
          <a href={`tel:${scheme.helpline.replace(/-/g, '')}`} className="text-sm font-semibold text-brand min-h-[44px] inline-flex items-center">
            <span aria-hidden="true">📞&nbsp;</span>
            {scheme.helpline}
          </a>
        )}
      </div>
    </article>
    </MagicCard>
  );
}
