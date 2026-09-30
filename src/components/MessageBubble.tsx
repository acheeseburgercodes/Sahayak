import { useState } from 'react';
import type { LangCode, Message } from '../types';
import { AGENTS } from '../agents/registry';
import { SUB_AGENTS } from '../agents/subAgents';
import { Markdown } from './Markdown';
import { ResourceList, StepList } from './ResourceList';
import { RoutingTrace } from './RoutingTrace';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

interface Props {
  message: Message;
  onSpeak: (text: string, lang: LangCode) => void;
  onStopSpeak: () => void;
  speaking: boolean;
  onRetry?: () => void;
}

export function MessageBubble({ message, onSpeak, onStopSpeak, speaking, onRetry }: Props) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const [copied, setCopied] = useState(false);

  if (message.author === 'user') {
    return (
      <article className="flex justify-end animate-fade-up" aria-label={`${s('you')}: ${message.body}`}>
        <p className="max-w-[85%] rounded-2xl rounded-ee-md bg-panel border border-line px-4 py-2.5 whitespace-pre-wrap">
          {message.body}
        </p>
      </article>
    );
  }

  if (message.author === 'system') {
    return (
      <p className="text-center text-xs text-muted py-1" role="status">
        {message.body}
      </p>
    );
  }

  const spec = AGENTS[message.author];
  const sub = message.subAgent ? SUB_AGENTS[message.subAgent] : undefined;
  const isHandoff = Boolean(message.handoff);
  const dev = settings.devMode;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is selectable anyway */
    }
  };

  return (
    <article
      className={['animate-fade-up', isHandoff ? 'ms-4 sm:ms-8 ps-3 border-s-2 border-line' : ''].join(' ')}
      aria-label={`${s('messageFrom')} ${spec.name}, ${spec.role}`}
    >
      <header className="flex items-center gap-1.5 flex-wrap text-sm mb-1">
        <span aria-hidden="true">{spec.emoji}</span>
        <h3 className="font-bold">{spec.name}</h3>
        {sub && <span className="text-muted">· {sub.name}</span>}
        {isHandoff && <span className="text-muted text-xs">· {s('handoffLabel')}</span>}
        {message.pending && (
          <span className="text-brand text-xs animate-pulse" role="status">
            {s('thinking')}
          </span>
        )}
        {dev && message.elapsedMs != null && (
          <span className="ms-auto font-mono text-[0.7rem] text-muted">{message.elapsedMs} ms</span>
        )}
      </header>

      {message.routing && (settings.showTrace || dev) && !isHandoff && (
        <RoutingTrace routing={message.routing} />
      )}

      <div className={message.error ? 'text-danger' : ''}>
        {message.pending && !message.body ? (
          <div className="space-y-2 py-1" aria-hidden="true">
            <div className="h-3 w-4/5 rounded bg-line/60" />
            <div className="h-3 w-full rounded bg-line/60" />
            <div className="h-3 w-2/3 rounded bg-line/60" />
          </div>
        ) : (
          <Markdown text={message.body} />
        )}
      </div>

      {message.error && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-danger flex-1">{message.error}</p>
          {onRetry && (
            <button type="button" className="btn btn-danger text-sm" onClick={onRetry}>
              {s('retry')}
            </button>
          )}
        </div>
      )}

      {message.steps && message.steps.length > 0 && <StepList steps={message.steps} />}
      {message.resources && message.resources.length > 0 && (
        <ResourceList items={message.resources} title={s('nearby')} />
      )}
      {message.helplines && message.helplines.length > 0 && (
        <ResourceList items={message.helplines} title={s('helplines')} />
      )}

      {dev && message.tools && message.tools.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-muted min-h-[32px] inline-flex items-center">
            {s('toolRuns')} ({message.tools.length})
          </summary>
          <ol className="mt-1 space-y-1.5 font-mono">
            {message.tools.map((tr, i) => (
              <li key={i} className="rounded-md border border-line bg-panel p-2">
                <p className="text-brand font-bold">{tr.name}</p>
                <p className="text-muted break-words">in: {tr.input}</p>
                <p className="break-words">out: {tr.output}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {!message.pending && message.body && (
        <footer className="flex gap-1 mt-1.5 -ms-2">
          <button
            type="button"
            className="icon-btn text-sm"
            onClick={() => (speaking ? onStopSpeak() : onSpeak(message.body, settings.lang))}
            aria-label={speaking ? s('stopReading') : `${s('readAloud')} — ${spec.name}`}
            title={speaking ? s('stopReading') : s('readAloud')}
          >
            <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
          </button>
          <button
            type="button"
            className="icon-btn text-sm"
            onClick={copy}
            aria-label={copied ? s('copied') : s('copy')}
            title={copied ? s('copied') : s('copy')}
          >
            <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
          </button>
          <span className="sr-only-focusable" role="status">
            {copied ? s('copied') : ''}
          </span>
        </footer>
      )}
    </article>
  );
}
