import type { ReactNode } from 'react';
import {
  Accessibility,
  AArrowDown,
  AArrowUp,
  CaseSensitive,
  Contrast,
  Link2,
  Moon,
  MousePointer2,
  Pause,
  RotateCcw,
  Space,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { Settings } from '../types';
import { DEFAULTS, useSettings } from '../context/SettingsContext';
import { useAnnounce } from '../context/AnnouncerContext';
import { makeT } from '../i18n/strings';

const MIN = 0.9;
const MAX = 1.6;
const STEP = 0.1;
const round = (n: number) => Math.round(n * 10) / 10;

interface Props {
  onRead: (text: string) => void;
  onStopReading: () => void;
  speaking: boolean;
}

/**
 * Always-on-page accessibility tools. Everything here is also in Settings,
 * but people who need these most should not have to find a gear icon first.
 * Every toggle is a real button with aria-pressed, an icon AND a text label,
 * and a 44px target; the text size is announced as it changes.
 */
export function A11yBar({ onRead, onStopReading, speaking }: Props) {
  const { settings, set } = useSettings();
  const announce = useAnnounce();
  const s = makeT(settings.lang);

  const setScale = (next: number) => {
    const v = round(Math.min(MAX, Math.max(MIN, next)));
    set('scale', v);
    announce(`${s('textSize')} ${Math.round(v * 100)}%`);
  };

  const toggle = <K extends keyof Settings>(key: K, on: Settings[K], off: Settings[K], label: string) => {
    const next = settings[key] === on ? off : on;
    set(key, next);
    announce(`${label}: ${next === on ? 'on' : 'off'}`);
  };

  const resetAll = () => {
    const keys = ['scale', 'contrast', 'theme', 'font', 'motion', 'links', 'spacing', 'cursor'] as const;
    for (const k of keys) set(k, DEFAULTS[k] as never);
    announce(s('a11yReset'));
  };

  /** Selection first; else the card/section holding focus; else the page intro. */
  const read = () => {
    if (speaking) {
      onStopReading();
      return;
    }
    const sel = window.getSelection()?.toString().trim();
    const focused = document.activeElement?.closest('article, section');
    const intro = document.getElementById('dash-title')?.closest('section');
    const text = sel || (focused as HTMLElement | null)?.innerText || intro?.innerText || '';
    if (text) onRead(text.slice(0, 2000));
  };

  if (!settings.a11yBar) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-3">
        <button
          type="button"
          id="a11y-toggle"
          className="inline-flex items-center gap-2 min-h-[44px] rounded-full border border-line bg-panel px-4 text-sm font-semibold shadow-sm hover:border-brand/60"
          aria-expanded={false}
          aria-controls="a11y-tools"
          onClick={() => set('a11yBar', true)}
        >
          <Accessibility aria-hidden="true" className="h-5 w-5 text-brand" />
          {s('a11yShow')}
        </button>
      </div>
    );
  }

  const pct = Math.round(settings.scale * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3">
      <section
        id="a11y-tools"
        aria-labelledby="a11y-title"
        className="rounded-2xl border border-line/80 bg-panel/85 backdrop-blur shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-x-auto thin-scroll px-2 py-2">
          <h2 id="a11y-title" className="flex shrink-0 items-center gap-1.5 ps-2 pe-1 text-sm font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
              <Accessibility aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="hidden md:inline">{s('a11yBar')}</span>
          </h2>

          {/* Text size stepper */}
          <div
            role="group"
            aria-label={s('textSize')}
            className="flex shrink-0 items-center rounded-xl border border-line bg-surface/70"
          >
            <Step label={s('textSmaller')} disabled={settings.scale <= MIN} onClick={() => setScale(settings.scale - STEP)}>
              <AArrowDown aria-hidden="true" className="h-5 w-5" />
            </Step>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="min-h-[44px] min-w-[3.5rem] px-1 text-sm font-bold tabular-nums hover:text-brand"
              aria-label={`${s('textReset')} (${pct}%)`}
              title={s('textReset')}
            >
              {pct}%
            </button>
            <Step label={s('textLarger')} disabled={settings.scale >= MAX} onClick={() => setScale(settings.scale + STEP)}>
              <AArrowUp aria-hidden="true" className="h-5 w-5" />
            </Step>
          </div>

          <Divider />

          <Tool
            pressed={settings.contrast === 'high'}
            onClick={() => toggle('contrast', 'high', 'normal', s('contrast'))}
            icon={<Contrast aria-hidden="true" className="h-4 w-4" />}
            label={s('contrast')}
          />
          <Tool
            pressed={settings.theme === 'dark'}
            onClick={() => toggle('theme', 'dark', 'light', s('theme'))}
            icon={<Moon aria-hidden="true" className="h-4 w-4" />}
            label={s('theme')}
          />
          <Tool
            pressed={settings.font === 'readable'}
            onClick={() => toggle('font', 'readable', 'default', s('readableFont'))}
            icon={<CaseSensitive aria-hidden="true" className="h-4 w-4" />}
            label={s('readableFont')}
          />
          <Tool
            pressed={settings.spacing === 'wide'}
            onClick={() => toggle('spacing', 'wide', 'normal', s('wideSpacing'))}
            icon={<Space aria-hidden="true" className="h-4 w-4" />}
            label={s('wideSpacing')}
          />
          <Tool
            pressed={settings.links === 'highlight'}
            onClick={() => toggle('links', 'highlight', 'normal', s('highlightLinks'))}
            icon={<Link2 aria-hidden="true" className="h-4 w-4" />}
            label={s('highlightLinks')}
          />
          <Tool
            pressed={settings.cursor === 'big'}
            onClick={() => toggle('cursor', 'big', 'normal', s('bigCursor'))}
            icon={<MousePointer2 aria-hidden="true" className="h-4 w-4" />}
            label={s('bigCursor')}
          />
          <Tool
            pressed={settings.motion === 'reduced'}
            onClick={() => toggle('motion', 'reduced', 'full', s('reduceMotion'))}
            icon={<Pause aria-hidden="true" className="h-4 w-4" />}
            label={s('reduceMotion')}
          />

          <Divider />

          <button
            type="button"
            onClick={read}
            // Keep the reader's text selection: do not steal focus on mouse down.
            onMouseDown={(e) => e.preventDefault()}
            className={`inline-flex shrink-0 items-center gap-1.5 min-h-[44px] rounded-xl px-3 text-sm font-semibold transition-colors ${
              speaking ? 'bg-danger text-white' : 'bg-brand text-brandInk hover:opacity-90'
            }`}
            title={s('readSelection')}
          >
            {speaking ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
            {speaking ? s('stopReading') : s('readAloud')}
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="inline-flex shrink-0 items-center gap-1.5 min-h-[44px] rounded-xl px-3 text-sm text-muted hover:bg-surface hover:text-ink"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{s('resetA11y')}</span>
            <span className="sr-only-focusable sm:hidden">{s('resetA11y')}</span>
          </button>

          <button
            type="button"
            className="icon-btn ms-auto"
            aria-expanded={true}
            aria-controls="a11y-tools"
            aria-label={s('a11yHide')}
            title={s('a11yHide')}
            onClick={() => {
              set('a11yBar', false);
              requestAnimationFrame(() => document.getElementById('a11y-toggle')?.focus());
            }}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

function Step({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-xl hover:bg-line/50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function Tool({ pressed, onClick, icon, label }: { pressed: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors ${
        pressed
          ? 'border-brand bg-brand/10 text-brand font-semibold'
          : 'border-transparent hover:border-line hover:bg-surface'
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
      {pressed && <span aria-hidden="true" className="text-xs">✓</span>}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-0.5 h-7 w-px shrink-0 bg-line" />;
}
