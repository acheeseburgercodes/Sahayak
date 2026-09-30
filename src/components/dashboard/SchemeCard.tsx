import { motion } from 'motion/react';
import { ChevronDown, ExternalLink, FileText, HelpCircle, Phone, Sparkles } from 'lucide-react';
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
const BADGE: Record<VerdictStatus, { icon: string; key: UiKey; cls: string; bar: string }> = {
  likely: { icon: '✓', key: 'likely', cls: 'text-ok border-ok/40 bg-ok/10', bar: 'bg-ok' },
  check: { icon: '?', key: 'check', cls: 'text-warn border-warn/40 bg-warn/10', bar: 'bg-warn' },
  no: { icon: '✕', key: 'notEligible', cls: 'text-muted border-line bg-surface', bar: 'bg-line' },
};

interface Props {
  scheme: Scheme;
  verdict: Verdict;
  entry?: TrackEntry;
  onAsk: AskFn;
  onToggleTrack: (id: string) => void;
  onToggleDoc: (id: string, doc: TrackEntry['have'][number]) => void;
}

/** Disclosure row: full-width summary with a rotating chevron (native <details>, so keyboard/AT work for free). */
function Disclosure({
  icon,
  title,
  open,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group/d border-t border-line/70" open={open}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="text-muted">
          {icon}
        </span>
        <span className="flex-1">{title}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open/d:rotate-180" />
      </summary>
      <div className="pb-3 text-sm">{children}</div>
    </details>
  );
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
  const docCount = entry ? `${entry.have.length}/${scheme.docs.length}` : String(scheme.docs.length);
  const docPct = entry ? Math.round((entry.have.length / Math.max(1, scheme.docs.length)) * 100) : 0;

  const ask = () =>
    onAsk(
      hi
        ? `${scheme.name.hi}: क्या मैं पात्र हूँ, कौन से कागज़ चाहिए, और आवेदन कैसे करूँ?`
        : `${scheme.name.en}: am I eligible, which documents do I need, and how do I apply?`,
      { agent: scheme.agent, sub: scheme.sub, origin: 'dashboard', label: scheme.name.en },
    );

  return (
    <MagicCard className="w-full rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_-8px_rgb(0_0_0/0.12)] transition-transform duration-200 hover:-translate-y-0.5">
      <article
        id={`card-${scheme.id}`}
        tabIndex={-1}
        aria-labelledby={headingId}
        className="relative flex h-full flex-col rounded-2xl"
      >
        {/* status accent; the badge below carries the same meaning in words */}
        <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${badge.bar}`} />

        <div className="flex flex-1 flex-col gap-3 p-5 pt-6">
          <header className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-2xl ring-1 ring-inset ring-brand/15"
            >
              {cat.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h3 id={headingId} className="text-base font-bold leading-snug text-ink [overflow-wrap:anywhere]">
                {name}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
                  {bi(cat, lang)}
                </span>
                <span className={`chip !py-0.5 ${badge.cls}`}>
                  <span aria-hidden="true">{badge.icon}</span>
                  {s(badge.key)}
                </span>
              </div>
            </div>
          </header>

          <p className="text-[0.95rem] leading-relaxed text-ink/90">{bi(scheme.benefit, lang)}</p>

          <div className="mt-1">
            <Disclosure icon={<HelpCircle className="h-4 w-4" />} title={s('whyVerdict')}>
              <ul className="ms-6 list-disc space-y-1">
                {verdict.reasons.map((reason) => (
                  <li key={reason.en}>{bi(reason, lang)}</li>
                ))}
              </ul>
              <p className="mt-2 ms-6 text-xs text-muted">{s('eligibilityNote')}</p>
            </Disclosure>

            <Disclosure
              icon={<FileText className="h-4 w-4" />}
              title={`${s('documentsNeeded')} (${docCount})`}
              open={Boolean(entry)}
            >
              {entry && (
                <div
                  className="mb-2 ms-6 h-1.5 overflow-hidden rounded-full bg-line/60"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={docPct}
                  aria-label={`${s('documentsNeeded')} ${docCount}`}
                >
                  <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${docPct}%` }} />
                </div>
              )}
              <ul className="ms-6 space-y-1" role="list">
                {scheme.docs.map((doc) => {
                  const label = bi(DOCS[doc], lang);
                  if (!entry) {
                    return (
                      <li key={doc} className="flex gap-2">
                        <span aria-hidden="true" className="text-muted">
                          •
                        </span>
                        {label}
                      </li>
                    );
                  }
                  const id = `${scheme.id}-doc-${doc}`;
                  const have = entry.have.includes(doc);
                  return (
                    <li key={doc}>
                      <label htmlFor={id} className="flex min-h-[40px] cursor-pointer items-center gap-2">
                        <input
                          id={id}
                          type="checkbox"
                          className="h-5 w-5 accent-[rgb(var(--c-brand))]"
                          checked={have}
                          onChange={() => onToggleDoc(scheme.id, doc)}
                        />
                        <span className={have ? 'text-muted line-through' : ''}>{label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Disclosure>
          </div>

          {/* Actions: one clear primary, secondary actions on a single quiet row */}
          <div className="mt-auto space-y-2 border-t border-line/70 pt-3">
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary flex-1 !rounded-xl shadow-sm" onClick={ask}>
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                {s('askAssistant')}
                <span aria-hidden="true" className="text-base leading-none">
                  {owner.emoji}
                </span>
              </button>
              <button
                type="button"
                className={`btn !rounded-xl !px-3 ${entry ? '!border-warn/60 bg-warn/10 text-warn' : ''}`}
                aria-pressed={Boolean(entry)}
                onClick={() => onToggleTrack(scheme.id)}
                aria-label={`${entry ? s('tracking') : s('track')}: ${name}`}
                title={entry ? s('tracking') : s('track')}
              >
                <motion.span
                  aria-hidden="true"
                  key={entry ? 'on' : 'off'}
                  initial={{ scale: 0.4, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="text-lg leading-none"
                >
                  {entry ? '★' : '☆'}
                </motion.span>
                <span className="hidden sm:inline">{entry ? s('tracking') : s('track')}</span>
              </button>
            </div>

            {(scheme.url || scheme.helpline) && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                {scheme.url && (
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-brand"
                  >
                    <ExternalLink aria-hidden="true" className="h-4 w-4 text-muted" />
                    {s('officialSite')}
                    <span className="sr-only-focusable"> (opens in a new tab)</span>
                  </a>
                )}
                {scheme.helpline && (
                  <a
                    href={`tel:${scheme.helpline.replace(/-/g, '')}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 font-semibold tabular-nums text-brand hover:bg-brand/10"
                    aria-label={`Call ${scheme.helpline}`}
                  >
                    <Phone aria-hidden="true" className="h-4 w-4" />
                    {scheme.helpline}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </MagicCard>
  );
}
