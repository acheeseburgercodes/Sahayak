import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';
import { LanguagePicker } from './LanguagePicker';

export type View = 'services' | 'assistant';

interface Props {
  onOpenSettings: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
  demoMode: boolean;
  view: View;
  onView: (view: View) => void;
  /** Unread assistant activity while the services view is showing (small screens). */
  assistantBadge: boolean;
}

export function Header({ onOpenSettings, onNewChat, hasMessages, demoMode, view, onView, assistantBadge }: Props) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);

  const tab = (v: View, icon: string, label: string) => (
    <button
      type="button"
      aria-pressed={view === v}
      onClick={() => onView(v)}
      className={[
        'relative inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold transition-colors',
        view === v ? 'bg-panel shadow-sm text-ink' : 'text-muted hover:text-ink',
      ].join(' ')}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
      {v === 'assistant' && assistantBadge && view !== 'assistant' && (
        <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-brand" aria-label="new" />
      )}
    </button>
  );

  return (
    <header className="bg-surface/90 backdrop-blur sticky top-0 z-30 border-b border-line/60">
      <div className="mx-auto max-w-7xl px-3 h-14 flex items-center gap-2">
        <h1 className="flex items-center gap-2 me-auto text-base font-extrabold tracking-tight min-w-0">
          <span
            aria-hidden="true"
            className="grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-brand text-brandInk text-sm font-black"
          >
            स
          </span>
          <span className="truncate">{s('appName')}</span>
          {demoMode && (
            <span
              className="hidden sm:inline text-[0.7rem] font-semibold text-warn border border-warn/50 rounded-full px-2 py-0.5"
              title={s('demoBanner')}
            >
              Demo
            </span>
          )}
          {settings.devMode && (
            <span className="text-[0.7rem] font-mono font-semibold text-brand border border-brand/50 rounded-full px-2 py-0.5">
              dev
            </span>
          )}
        </h1>

        {/* On wide screens both panes are visible, so the switch only exists below lg. */}
        <nav aria-label={s('viewSwitch')} className="lg:hidden flex gap-0.5 rounded-xl bg-line/40 p-0.5">
          {tab('services', '🏛️', s('navServices'))}
          {tab('assistant', '💬', s('navAssistant'))}
        </nav>

        <div className="hidden sm:block w-36 sm:w-44">
          <LanguagePicker compact />
        </div>

        {hasMessages && (
          <button type="button" className="icon-btn" onClick={onNewChat} aria-label={s('newChat')} title={s('newChat')}>
            <span aria-hidden="true">↺</span>
          </button>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          aria-haspopup="dialog"
          aria-label={s('settings')}
          title={s('settings')}
        >
          <span aria-hidden="true">⚙</span>
        </button>
      </div>
    </header>
  );
}
