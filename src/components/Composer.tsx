import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';
import { AGENTS, AGENT_ORDER } from '../agents/registry';
import { SUB_AGENTS, subAgentsOf } from '../agents/subAgents';
import type { ForcedRoute, WorkerId } from '../types';
import { BorderBeam } from '@/components/ui/border-beam';

export interface ComposerHandle {
  focus: () => void;
  setText: (text: string) => void;
}

interface Props {
  onSend: (text: string) => void;
  busy: boolean;
  forced: ForcedRoute | null;
  onForce: (route: ForcedRoute | null) => void;
  listening: boolean;
  interim: string;
  micError: string | null;
  sttSupported: boolean;
  onStartListening: (onFinal: (text: string) => void) => void;
  onStopListening: () => void;
  onClearMicError: () => void;
}

/** `agent` or `agent|sub` — one flat value for the developer <select>. */
const encode = (r: ForcedRoute | null) => (r ? (r.sub ? `${r.agent}|${r.sub}` : r.agent) : '');
const decode = (v: string): ForcedRoute | null => {
  if (!v) return null;
  const [agent, sub] = v.split('|');
  return { agent: agent as WorkerId, sub: sub || undefined };
};

/** Developer-mode control: pick any teammate or any of its sub-agents by hand. */
function DevRoutePicker({ forced, onForce }: Pick<Props, 'forced' | 'onForce'>) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const id = useId();

  return (
    <div className="flex items-center gap-2 mb-2 text-xs">
      <label htmlFor={id} className="font-mono text-muted shrink-0">
        {s('routeTo')}
      </label>
      <select
        id={id}
        className="field !min-h-[36px] py-1 text-xs font-mono flex-1"
        value={encode(forced)}
        onChange={(e) => onForce(decode(e.target.value))}
      >
        <option value="">{s('autoRoute')}</option>
        {AGENT_ORDER.map((aid) => {
          const a = AGENTS[aid];
          const subs = subAgentsOf(aid as WorkerId);
          return (
            <optgroup key={aid} label={`${a.emoji} ${a.name} — ${a.role}`}>
              <option value={aid}>
                {a.name} › {s('autoSub')}
              </option>
              {subs.map((sub) => (
                <option key={sub.id} value={`${aid}|${sub.id}`}>
                  {a.name} › {sub.name} — {sub.focus}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {forced && (
        <button type="button" className="icon-btn !h-9 !w-9" onClick={() => onForce(null)} aria-label={s('unpin')}>
          ✕
        </button>
      )}
    </div>
  );
}

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  {
    onSend,
    busy,
    forced,
    onForce,
    listening,
    interim,
    micError,
    sttSupported,
    onStartListening,
    onStopListening,
    onClearMicError,
  },
  ref,
) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const [text, setText] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => areaRef.current?.focus(),
    setText: (value: string) => {
      setText(value);
      areaRef.current?.focus();
    },
  }));

  // Grow with content instead of scrolling — easier for low-vision users.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText('');
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-surface via-surface to-surface/0 pt-4" id="composer">
      <div className="mx-auto max-w-3xl px-3 pb-3">
        {micError && (
          <div role="alert" className="mb-2 rounded-lg border border-danger p-2.5 text-sm flex items-start gap-2 bg-panel">
            <span aria-hidden="true">⚠️</span>
            <p className="flex-1">{micError}</p>
            <button type="button" className="icon-btn !h-8 !w-8 text-xs" onClick={onClearMicError} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {settings.devMode ? (
          <DevRoutePicker forced={forced} onForce={onForce} />
        ) : (
          forced && (
            <p className="mb-2 text-xs text-muted flex items-center gap-2">
              <span aria-hidden="true">📌</span>
              {s('pinnedTo')} <strong className="text-ink">{AGENTS[forced.agent].name}</strong>
              {forced.sub && SUB_AGENTS[forced.sub] && <span>› {SUB_AGENTS[forced.sub].name}</span>}
              <button type="button" className="underline min-h-[32px]" onClick={() => onForce(null)}>
                {s('unpin')}
              </button>
            </p>
          )
        )}

        {listening && (
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand" role="status">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-danger animate-pulse-ring" />
            {s('listening')}
            {interim && <span className="font-normal text-muted italic">“{interim}”</span>}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative flex items-end gap-1.5 rounded-2xl border border-line bg-panel p-1.5 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand"
        >
          {/* 21st.dev Border Beam: the team is working on your question. */}
          {busy && <BorderBeam duration={2.5} size={80} borderWidth={2} />}
          <label htmlFor="ask" className="sr-only-focusable">
            {s('askPlaceholder')}
          </label>
          <textarea
            id="ask"
            ref={areaRef}
            className="flex-1 resize-none bg-transparent px-2.5 py-2.5 text-base leading-relaxed min-h-[44px]
                       placeholder:text-muted focus-visible:outline-none"
            rows={1}
            placeholder={s('askPlaceholder')}
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            aria-describedby="composer-hint"
          />

          {sttSupported && (
            <button
              type="button"
              className={`icon-btn ${listening ? '!bg-danger !text-white' : ''}`}
              aria-pressed={listening}
              aria-label={listening ? s('stopSpeaking') : s('speak')}
              title={listening ? s('stopSpeaking') : s('speak')}
              onClick={() =>
                listening
                  ? onStopListening()
                  : onStartListening((v) => setText((p) => (p ? `${p} ${v}` : v)))
              }
            >
              <span aria-hidden="true">{listening ? '⏹' : '🎤'}</span>
            </button>
          )}

          <button
            type="submit"
            className="icon-btn !bg-brand !text-brandInk disabled:!opacity-40"
            disabled={busy || !text.trim()}
            aria-label={s('send')}
            title={s('send')}
          >
            <span aria-hidden="true">↑</span>
          </button>
        </form>

        <p id="composer-hint" className="mt-1.5 text-[0.7rem] text-muted text-center">
          {s('disclaimer')}
          <span className="sr-only-focusable"> {s('shortcutsList')}</span>
        </p>
      </div>
    </div>
  );
});
