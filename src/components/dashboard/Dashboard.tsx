import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Search, ArrowRight, Phone } from 'lucide-react';
import type { AgentId, WorkerId } from '../../types';
import { personaOf, bi } from '../../dashboard/personas';
import { effectiveProfile } from '../../dashboard/profile';
import { CATEGORY_LABEL, schemesFor } from '../../dashboard/schemes';
import type { Category } from '../../dashboard/schemes';
import { useTracker } from '../../dashboard/useTracker';
import { AGENTS, WORKING_AGENTS } from '../../agents/registry';
import { helplinesFor } from '../../lib/data';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { BlurFade } from '@/components/ui/blur-fade';
import { PersonaPicker } from './PersonaPicker';
import { ProfileForm } from './ProfileForm';
import { SchemeCard } from './SchemeCard';
import type { AskFn } from './SchemeCard';
import { SeasonCalendar } from './SeasonCalendar';
import { TrackerPanel } from './TrackerPanel';

type Filter = 'all' | 'likely' | Category;

interface Props {
  onAsk: AskFn;
  onPin: (agent: WorkerId) => void;
  busyIds: AgentId[];
}

/**
 * The government-services dashboard. Everything on it is deterministic
 * (catalogue + rules); the AI team is one click away from every card and
 * receives the card's context, so answers start from the right specialist.
 *
 * Motion components are from 21st.dev (Magic UI) in `src/components/ui`.
 * All of them respect the app's reduced-motion setting via <MotionConfig>.
 */
export function Dashboard({ onAsk, onPin, busyIds }: Props) {
  const { settings, set } = useSettings();
  const s = makeT(settings.lang);
  const lang = settings.lang;
  const reduced = settings.motion === 'reduced';
  const persona = personaOf(settings.persona);
  const profile = effectiveProfile(settings.persona, settings.profile);
  const { tracker, toggle, toggleDoc, setStatus } = useTracker();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [showOthers, setShowOthers] = useState(false);

  const profileKey = JSON.stringify(profile);
  const all = useMemo(
    () => schemesFor(persona.id, profile, { all: showOthers }),
    // `profile` is rebuilt every render; its serialised content is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona.id, profileKey, showOthers],
  );
  const mine = all.filter((x) => x.mine);

  const categories = useMemo(() => [...new Set(all.map((x) => x.scheme.category))], [all]);

  const q = query.trim().toLowerCase();
  const shown = all.filter(({ scheme, verdict }) => {
    if (filter === 'likely' && verdict.status !== 'likely') return false;
    if (filter !== 'all' && filter !== 'likely' && scheme.category !== filter) return false;
    if (!q) return true;
    return [scheme.name.en, scheme.name.hi, scheme.benefit.en, scheme.benefit.hi, scheme.id].some((t) =>
      t.toLowerCase().includes(q),
    );
  });

  const tracked = Object.values(tracker);
  const stats = [
    { value: mine.filter((x) => x.verdict.status === 'likely').length, label: s('statLikely'), tone: 'text-ok' },
    { value: mine.length, label: s('statSchemes'), tone: 'text-ink' },
    { value: tracked.length, label: s('statTracked'), tone: 'text-warn' },
    { value: tracked.reduce((n, e) => n + e.have.length, 0), label: s('statDocs'), tone: 'text-brand' },
  ];

  const jumpTo = (id: string) => {
    setFilter('all');
    setQuery('');
    if (!all.some((x) => x.scheme.id === id)) setShowOthers(true);
    // Wait for the list to re-render with the card in it.
    requestAnimationFrame(() => {
      const el = document.getElementById(`card-${id}`);
      el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    });
  };

  // Filter chips share one sliding highlight (animated tabs pattern).
  const filterChip = (value: Filter, label: string) => {
    const active = filter === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => setFilter(value)}
        className={`relative chip min-h-[40px] !text-sm transition-colors ${active ? '!border-brand text-brandInk' : 'hover:bg-panel'}`}
      >
        {active && (
          <motion.span
            layoutId="filter-pill"
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-brand"
            transition={{ type: 'spring', stiffness: 450, damping: 36 }}
          />
        )}
        <span className="relative">{label}</span>
      </button>
    );
  };

  const helplines = helplinesFor(persona.helplines);
  const lead = AGENTS[persona.lead];

  return (
    <div className="space-y-6 py-6">
      {/* ---------------- Hero ---------------- */}
      <BlurFade>
        <section
          aria-labelledby="dash-title"
          className="relative overflow-hidden rounded-2xl border border-line bg-panel p-5 sm:p-7"
        >
          {/* soft brand glow, decorative */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -end-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -start-16 h-60 w-60 rounded-full bg-warn/10 blur-3xl" />
          <BorderBeam duration={9} size={120} />

          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-semibold">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
              <AnimatedShinyText>
                {WORKING_AGENTS.length} {s('heroBadge')}
              </AnimatedShinyText>
            </p>

            <h2 id="dash-title" className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
              {s('dashTitle')}
            </h2>
            <p className="text-muted mt-1.5 max-w-2xl">{s('dashSubtitle')}</p>

            <div className="mt-5">
              <PersonaPicker value={persona.id} onChange={(id) => set('persona', id)} />
            </div>

            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((st, i) => (
                <div key={st.label} className="flex flex-col-reverse rounded-xl border border-line bg-surface/60 px-3 py-2.5">
                  <dt className="text-xs text-muted">{st.label}</dt>
                  <dd className={`text-2xl sm:text-3xl font-extrabold ${st.tone}`}>
                    {/* key restarts the count when the persona changes */}
                    <NumberTicker key={`${persona.id}-${st.value}`} value={st.value} delay={i * 0.08} instant={reduced} className={st.tone} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </BlurFade>

      {/* ---------------- Persona: team + quick services ---------------- */}
      <BlurFade delay={0.08} key={persona.id}>
        <section aria-labelledby="hero-title" className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="text-4xl leading-none">
              {persona.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="hero-title" className="text-xl font-bold">
                {bi(persona.name, lang)}
              </h2>
              <p className="text-sm text-muted">{bi(persona.blurb, lang)}</p>
            </div>
            <ShimmerButton onClick={() => onPin(persona.lead)} aria-label={`${s('askTeam')} ${lead.name}, ${lead.role}`}>
              <span aria-hidden="true">{lead.emoji}</span>
              {s('askTeam')} {lead.name}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ShimmerButton>
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">{s('yourTeam')}</h3>
          <ul className="mt-1.5 flex flex-wrap gap-1.5" role="list">
            {persona.team.map((id) => {
              const a = AGENTS[id];
              const busy = busyIds.includes(id);
              return (
                <li key={id}>
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPin(id)}
                    className="relative inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full border border-line bg-surface/50 text-sm hover:border-brand/60"
                    aria-label={`${s('askTeam')} ${a.name}, ${a.role}`}
                    title={a.blurb}
                  >
                    <span aria-hidden="true">{a.emoji}</span>
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-muted hidden sm:inline">· {a.role}</span>
                    {busy && (
                      <span aria-hidden="true" className="absolute top-1 end-1 h-2 w-2 rounded-full bg-brand animate-pulse" />
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">{s('quickServices')}</h3>
          <ul className="mt-1.5 grid gap-2 sm:grid-cols-2" role="list">
            {persona.services.map((svc, i) => (
              <li key={svc.id}>
                <BlurFade delay={0.1 + i * 0.05}>
                  <MagicCard className="h-full">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onAsk(bi(svc.prompt, lang), {
                          agent: svc.agent,
                          sub: svc.sub,
                          origin: 'dashboard',
                          label: svc.label.en,
                        })
                      }
                      className="group/svc w-full h-full text-start flex items-center gap-3 rounded-xl px-3 py-3 min-h-[60px]"
                    >
                      <span aria-hidden="true" className="grid place-items-center h-10 w-10 shrink-0 rounded-lg bg-surface text-xl">
                        {svc.emoji}
                      </span>
                      <span className="flex-1 text-sm font-semibold leading-snug">{bi(svc.label, lang)}</span>
                      <span aria-hidden="true" className="flex items-center gap-1 text-muted text-xs">
                        {AGENTS[svc.agent].emoji}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/svc:translate-x-1" />
                      </span>
                    </motion.button>
                  </MagicCard>
                </BlurFade>
              </li>
            ))}
          </ul>
        </section>
      </BlurFade>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* ---------------- Scheme catalogue ---------------- */}
        <section aria-labelledby="schemes-title" className="min-w-0">
          <div className="flex flex-wrap items-end gap-3">
            <h2 id="schemes-title" className="text-lg font-bold me-auto">
              {s('schemesForYou')}
            </h2>
            <div className="relative w-full sm:w-64">
              <label htmlFor="scheme-search" className="sr-only-focusable">
                {s('searchSchemes')}
              </label>
              <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                id="scheme-search"
                type="search"
                className="field ps-9"
                placeholder={s('searchSchemes')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={s('schemesForYou')}>
            {filterChip('all', s('filterAll'))}
            {filterChip('likely', `✓ ${s('filterLikely')}`)}
            {categories.map((c) => filterChip(c, `${CATEGORY_LABEL[c].emoji} ${bi(CATEGORY_LABEL[c], lang)}`))}
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm min-h-[44px] cursor-pointer w-fit">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[rgb(var(--c-brand))]"
              checked={showOthers}
              onChange={(e) => setShowOthers(e.target.checked)}
            />
            {s('showOthers')}
          </label>

          <p className="text-xs text-muted mt-1" role="status" aria-live="polite">
            {shown.length} {s('resultsCount')}
          </p>

          {shown.length === 0 ? (
            <p className="mt-4 text-sm">{s('noMatch')}</p>
          ) : (
            <motion.ul layout className="mt-4 grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]" role="list">
              <AnimatePresence initial={false} mode="popLayout">
                {shown.map(({ scheme, verdict }, i) => (
                  <motion.li
                    key={scheme.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
                    className="flex"
                  >
                    <SchemeCard
                      scheme={scheme}
                      verdict={verdict}
                      entry={tracker[scheme.id]}
                      onAsk={onAsk}
                      onToggleTrack={toggle}
                      onToggleDoc={toggleDoc}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </section>

        {/* ---------------- Side column ---------------- */}
        <div className="space-y-4 min-w-0">
          <ProfileForm profile={settings.profile ?? {}} onChange={(p) => set('profile', p)} />
          <TrackerPanel tracker={tracker} onStatus={setStatus} onRemove={toggle} onJump={jumpTo} />
          <SeasonCalendar persona={persona.id} />
          {helplines.length > 0 && (
            <section aria-labelledby="dash-helplines" className="card p-4">
              <h2 id="dash-helplines" className="font-bold flex items-center gap-2">
                <Phone aria-hidden="true" className="h-4 w-4 text-brand" />
                {s('helplinesFor')}
              </h2>
              <ul className="mt-2 space-y-1" role="list">
                {helplines.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`tel:${h.phone}`}
                      className="group flex items-baseline gap-2 min-h-[44px] py-1 rounded-lg px-1 hover:bg-surface"
                    >
                      <strong className="text-brand shrink-0 group-hover:underline">{h.name}</strong>
                      <span className="text-sm">{h.detail}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
