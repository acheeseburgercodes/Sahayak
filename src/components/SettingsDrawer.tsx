import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';
import { LanguagePicker } from './LanguagePicker';
import { AiKeySection } from './AiKeySection';
import { PLACES } from '../lib/data';
import { useAnnounce } from '../context/AnnouncerContext';

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 py-2.5 cursor-pointer min-h-[44px]">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--c-brand))]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="font-semibold text-sm block">{label}</span>
        {hint && <span className="text-xs text-muted block mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, set, reset } = useSettings();
  const s = makeT(settings.lang);
  const announce = useAnnounce();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Focus management: remember the opener, move focus in, trap Tab, restore.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-full max-w-sm h-full overflow-y-auto thin-scroll bg-panel border-s border-line p-4 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <h2 id="settings-title" className="text-lg font-black me-auto">
            {s('settings')}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={s('closeSettings')}>
            ✕
          </button>
        </div>

        <fieldset className="mb-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
            {s('language')}
          </legend>
          <LanguagePicker />
        </fieldset>

        <AiKeySection announce={announce} />

        <fieldset className="mb-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
            {s('yourArea')}
          </legend>
          <label className="label" htmlFor="place">
            {s('yourArea')}
          </label>
          <select
            id="place"
            className="field"
            value={settings.place.label}
            onChange={(e) => {
              const p = PLACES.find((x) => x.label === e.target.value);
              if (p) {
                set('place', p);
                announce(`Area changed to ${p.label}`);
              }
            }}
          >
            {PLACES.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label} ({p.state})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">
            Used to pick the nearest ration shop, shelter, hospital and office.
          </p>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
            {s('appearance')}
          </legend>

          <label className="label" htmlFor="scale">
            {s('textSize')} — {Math.round(settings.scale * 100)}%
          </label>
          <input
            id="scale"
            type="range"
            min={0.9}
            max={1.6}
            step={0.1}
            value={settings.scale}
            className="w-full accent-[rgb(var(--c-brand))] min-h-[44px]"
            onChange={(e) => set('scale', Number(e.target.value))}
            aria-valuetext={`${Math.round(settings.scale * 100)} percent`}
          />

          <div className="divide-y divide-line">
            <Toggle
              label={s('theme')}
              checked={settings.theme === 'dark'}
              onChange={(v) => set('theme', v ? 'dark' : 'light')}
            />
            <Toggle
              label={s('contrast')}
              hint="Pure black on white with heavy borders."
              checked={settings.contrast === 'high'}
              onChange={(v) => set('contrast', v ? 'high' : 'normal')}
            />
            <Toggle
              label={s('readableFont')}
              hint="Wider letters and looser spacing — easier with dyslexia."
              checked={settings.font === 'readable'}
              onChange={(v) => set('font', v ? 'readable' : 'default')}
            />
            <Toggle
              label={s('reduceMotion')}
              checked={settings.motion === 'reduced'}
              onChange={(v) => set('motion', v ? 'reduced' : 'full')}
            />
            <Toggle
              label={s('wideSpacing')}
              hint="Extra space between lines, letters and words."
              checked={settings.spacing === 'wide'}
              onChange={(v) => set('spacing', v ? 'wide' : 'normal')}
            />
            <Toggle
              label={s('highlightLinks')}
              hint="Underline and outline every link."
              checked={settings.links === 'highlight'}
              onChange={(v) => set('links', v ? 'highlight' : 'normal')}
            />
            <Toggle
              label={s('bigCursor')}
              checked={settings.cursor === 'big'}
              onChange={(v) => set('cursor', v ? 'big' : 'normal')}
            />
            <Toggle
              label={s('a11yShow')}
              hint="Keep the accessibility toolbar at the top of the page (Alt+A)."
              checked={settings.a11yBar}
              onChange={(v) => set('a11yBar', v)}
            />
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
            {s('settings')}
          </legend>
          <div className="divide-y divide-line">
            <Toggle
              label={s('autoSpeak')}
              hint="Every answer is read out as soon as it arrives."
              checked={settings.autoSpeak}
              onChange={(v) => set('autoSpeak', v)}
            />
            <Toggle
              label={s('simpleLanguage')}
              hint="Short sentences, no official jargon."
              checked={settings.simpleLanguage}
              onChange={(v) => set('simpleLanguage', v)}
            />
            <Toggle
              label={s('showTrace')}
              hint="Shows which helper was chosen and why."
              checked={settings.showTrace}
              onChange={(v) => set('showTrace', v)}
            />
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
            {s('developer')}
          </legend>
          <Toggle
            label={s('devMode')}
            hint={`${s('devModeHint')} Shortcut: Ctrl+Shift+D.`}
            checked={settings.devMode}
            onChange={(v) => {
              set('devMode', v);
              announce(v ? 'Developer mode on' : 'Developer mode off');
            }}
          />
          {settings.devMode && (
            <div className="mt-2">
              <label className="label" htmlFor="router-engine">
                {s('routerEngine')}
              </label>
              <select
                id="router-engine"
                className="field font-mono text-sm"
                value={settings.routerEngine}
                onChange={(e) => set('routerEngine', e.target.value as typeof settings.routerEngine)}
              >
                <option value="auto">auto — Sarvam LLM, rules as prior and fallback</option>
                <option value="rules">rules — deterministic only, never calls the LLM</option>
              </select>
            </div>
          )}
        </fieldset>

        <button
          type="button"
          className="btn w-full"
          onClick={() => {
            reset();
            announce('Settings reset to defaults');
          }}
        >
          Reset all settings
        </button>

        <p className="text-xs text-muted mt-4">{s('disclaimer')}</p>
      </div>
    </div>
  );
}
