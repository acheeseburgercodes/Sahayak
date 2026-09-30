import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { BlurFade } from '@/components/ui/blur-fade';
import type { ForcedRoute, LangCode, Message, WorkerId } from './types';
import { useSettings } from './context/SettingsContext';
import { useAnnounce } from './context/AnnouncerContext';
import { makeT } from './i18n/strings';
import { AGENTS } from './agents/registry';
import { SUB_AGENTS } from './agents/subAgents';
import { EmergencyBar } from './components/EmergencyBar';
import { Header } from './components/Header';
import type { View } from './components/Header';
import { TeammateRail } from './components/TeammateRail';
import { QuickHelp } from './components/QuickHelp';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import type { ComposerHandle } from './components/Composer';
import { SettingsDrawer } from './components/SettingsDrawer';
import { A11yBar } from './components/A11yBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { useConversation } from './hooks/useConversation';
import { useSpeech } from './hooks/useSpeech';
import { onSarvamAvailability, probeSarvam, sarvamAvailable } from './lib/sarvam';
import { isAndroid } from './lib/platform';
import { App as CapApp } from '@capacitor/app';
import { personaOf } from './dashboard/personas';

export default function App() {
  const { settings, set } = useSettings();
  const announce = useAnnounce();
  const s = makeT(settings.lang);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forced, setForced] = useState<ForcedRoute | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  // Small screens show one pane at a time; wide screens show both side by side.
  const [view, setView] = useState<View>('services');
  const [unseen, setUnseen] = useState(false);

  const composerRef = useRef<ComposerHandle>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const speech = useSpeech();

  const onAnswer = useCallback(
    (m: Message) => {
      if (settings.autoSpeak && m.body) void speech.speak(m.body, settings.lang);
    },
    [settings.autoSpeak, settings.lang, speech],
  );

  const { messages, busy, busyIds, activeId, send, clear, retry } = useConversation({
    settings,
    announce,
    onAnswer,
  });

  // Probe the proxy so the UI can honestly say whether it is in demo mode, and
  // re-probe when a key is saved/cleared in the desktop or Android app.
  useEffect(() => {
    const off = onSarvamAvailability((ok) => setDemoMode(!ok));
    void probeSarvam();
    return off;
  }, []);

  // Android hardware back: close Settings first, then leave the assistant
  // pane for the services pane, and only then let the OS minimise the app.
  const backState = useRef({ settingsOpen, view });
  backState.current = { settingsOpen, view };
  useEffect(() => {
    if (!isAndroid()) return;
    let remove: (() => void) | undefined;
    void CapApp.addListener('backButton', () => {
      const st = backState.current;
      if (st.settingsOpen) setSettingsOpen(false);
      else if (st.view === 'assistant' && window.innerWidth < 1024) setView('services');
      else void CapApp.minimizeApp();
    }).then((h) => {
      remove = () => void h.remove();
    });
    return () => remove?.();
  }, []);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // Sub-agent picks only exist in developer mode; drop one if it is turned off.
  useEffect(() => {
    if (!settings.devMode) setForced((f) => (f?.sub && f.origin !== 'dashboard' ? { agent: f.agent } : f));
  }, [settings.devMode]);

  // Keep the newest message in view inside the assistant pane, and flag
  // activity the user cannot see while the services pane is showing.
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: settings.motion === 'reduced' ? 'auto' : 'smooth' });
    if (messages.length > 0 && view === 'services') setUnseen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, settings.motion]);

  const showView = useCallback((v: View) => {
    setView(v);
    if (v === 'assistant') setUnseen(false);
  }, []);

  const focusComposer = useCallback(() => {
    showView('assistant');
    // The pane may have just become visible; focus after it renders.
    requestAnimationFrame(() => composerRef.current?.focus());
  }, [showView]);

  // Global shortcuts: / compose, Alt+M team list, Ctrl+Shift+D developer mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      if (e.key === '/' && !typing) {
        e.preventDefault();
        focusComposer();
      }
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        showView('assistant');
        requestAnimationFrame(() =>
          document.getElementById('teammates')?.querySelector<HTMLElement>('button')?.focus(),
        );
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (!settings.a11yBar) set('a11yBar', true);
        requestAnimationFrame(() =>
          document.getElementById('a11y-tools')?.querySelector<HTMLElement>('button')?.focus(),
        );
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const next = !settings.devMode;
        set('devMode', next);
        announce(next ? 'Developer mode on' : 'Developer mode off');
      }
      if (e.key === 'Escape' && speech.speaking) speech.stopSpeaking();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [announce, focusComposer, set, settings.devMode, settings.a11yBar, showView, speech]);

  const handleForce = useCallback(
    (route: ForcedRoute | null) => {
      setForced(route);
      if (!route) announce('Router will choose the helper');
      else {
        const sub = route.sub ? SUB_AGENTS[route.sub] : undefined;
        announce(`Pinned to ${AGENTS[route.agent].name}${sub ? `, ${sub.name}` : ''}`);
      }
      composerRef.current?.focus();
    },
    [announce],
  );

  const handleSend = useCallback(
    (text: string) => {
      void send(text, forced);
      // A pin is one-shot for users; in developer mode it sticks so the same
      // sub-agent can be exercised with several inputs.
      if (!settings.devMode) setForced(null);
    },
    [forced, send, settings.devMode],
  );

  /** A scheme card or quick service asked the AI team: its owner leads. */
  const askFromDashboard = useCallback(
    (text: string, route: ForcedRoute) => {
      showView('assistant');
      if (busy) {
        // Never drop the question: park it in the box until the team is free.
        composerRef.current?.setText(text);
        return;
      }
      announce(`${s('askAssistant')}: ${AGENTS[route.agent].name}`);
      void send(text, route);
    },
    [announce, busy, s, send, showView],
  );

  const pinFromDashboard = useCallback(
    (agent: WorkerId) => {
      showView('assistant');
      requestAnimationFrame(() => handleForce({ agent }));
    },
    [handleForce, showView],
  );

  const handleClear = useCallback(() => {
    if (messages.length > 0 && !window.confirm(s('clearConfirm'))) return;
    clear();
    announce('Conversation cleared');
    composerRef.current?.focus();
  }, [announce, clear, messages.length, s]);

  const speakMessage = useCallback(
    (text: string, lang: LangCode) => void speech.speak(text, lang),
    [speech],
  );

  const persona = personaOf(settings.persona);

  return (
    <MotionConfig reducedMotion={settings.motion === 'reduced' ? 'always' : 'user'}>
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="sr-only-focusable" onClick={() => showView('services')}>
        {s('skipToMain')}
      </a>
      <a
        href="#ask"
        className="sr-only-focusable"
        onClick={(e) => {
          e.preventDefault();
          focusComposer();
        }}
      >
        {s('skipToComposer')}
      </a>

      <EmergencyBar />
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onNewChat={handleClear}
        hasMessages={messages.length > 0}
        demoMode={demoMode}
        view={view}
        onView={showView}
        assistantBadge={unseen}
      />

      <A11yBar
        onRead={(text) => void speech.speak(text, settings.lang)}
        onStopReading={speech.stopSpeaking}
        speaking={speech.speaking}
      />

      {!online && (
        <p role="alert" className="bg-warn text-white text-sm text-center py-2 px-3">
          {s('offline')}
        </p>
      )}

      <div className="flex-1 mx-auto w-full max-w-7xl lg:grid lg:grid-cols-[minmax(0,1fr)_27rem]">
        <main
          id="main"
          tabIndex={-1}
          className={`min-w-0 px-4 ${view === 'assistant' ? 'hidden lg:block' : ''}`}
        >
          <Dashboard onAsk={askFromDashboard} onPin={pinFromDashboard} busyIds={busyIds} />
          {demoMode && <p className="pb-6 text-xs text-muted">{s('demoBanner')}</p>}
        </main>

        <aside
          id="assistant"
          aria-labelledby="assistant-title"
          className={`${view === 'services' ? 'hidden lg:flex' : 'flex'} flex-col min-w-0
                      h-[calc(100dvh-3.5rem)] sticky top-14 lg:border-s lg:border-line/60`}
        >
          <h2 id="assistant-title" className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-muted flex items-center gap-1.5">
            <span aria-hidden="true">💬</span>
            {s('assistantTitle')}
            <span className="normal-case font-semibold tracking-normal">
              · {persona.emoji} {settings.lang === 'hi-IN' ? persona.name.hi : persona.name.en}
            </span>
          </h2>
          <TeammateRail activeId={activeId} busyIds={busyIds} forced={forced} onForce={handleForce} />

          <div ref={feedRef} className="flex-1 overflow-y-auto thin-scroll px-4 pb-4 min-h-0">
            {messages.length === 0 ? (
              <QuickHelp
                onPick={(text) => composerRef.current?.setText(text)}
                extra={persona.services.map((svc) => ({ emoji: svc.emoji, en: svc.prompt.en, hi: svc.prompt.hi }))}
              />
            ) : (
              <div className="space-y-6 pt-4" role="log" aria-live="off" aria-label="Conversation">
                {messages.map((m) => (
                  <BlurFade key={m.id} offset={10} blur="4px">
                    <MessageBubble
                      message={m}
                      onSpeak={speakMessage}
                      onStopSpeak={speech.stopSpeaking}
                      speaking={speech.speaking}
                      onRetry={m.error ? retry : undefined}
                    />
                  </BlurFade>
                ))}
              </div>
            )}
          </div>

          <Composer
            ref={composerRef}
            onSend={handleSend}
            busy={busy}
            forced={forced}
            onForce={handleForce}
            listening={speech.listening}
            interim={speech.interim}
            micError={speech.micError}
            sttSupported={speech.sttSupported || sarvamAvailable()}
            onStartListening={(onFinal) => void speech.startListening(settings.lang, onFinal)}
            onStopListening={speech.stopListening}
            onClearMicError={speech.clearMicError}
          />
        </aside>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
    </MotionConfig>
  );
}
