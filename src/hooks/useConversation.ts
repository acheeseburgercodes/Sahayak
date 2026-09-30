import { useCallback, useRef, useState } from 'react';
import type { AgentId, ForcedRoute, Message, RoutingDecision, Settings } from '../types';
import { AGENTS } from '../agents/registry';
import { SUB_AGENTS } from '../agents/subAgents';
import { routeForced, routeWithRules, routeWithSarvam } from '../agents/router';
import { runAgent, runCollaboratorNote, runPlanner } from '../agents/run';
import { detectLanguage } from '../agents/language';
import { t } from '../i18n/strings';
import { personaOf } from '../dashboard/personas';

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}-${(counter += 1)}`;

interface Options {
  settings: Settings;
  announce: (text: string, assertive?: boolean) => void;
  onAnswer?: (message: Message) => void;
}

/**
 * Orchestrates one user turn: route → sub-route → primary answers (running its
 * tools, or fanning out in parallel for the planner) → collaborators chime in.
 */
export function useConversation({ settings, announce, onAnswer }: Options) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<AgentId[]>([]);
  const [activeId, setActiveId] = useState<AgentId | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastQuestion = useRef<{ text: string; forced: ForcedRoute | null } | null>(null);

  const patch = useCallback((id: string, changes: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  }, []);

  const historyFor = useCallback((): Array<{ role: 'user' | 'assistant'; content: string }> => {
    return messages
      .filter((m) => m.author !== 'system' && !m.pending && m.body)
      .map((m) => ({
        role: m.author === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.body,
      }));
  }, [messages]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setBusyIds([]);
    setActiveId(null);
    setBusy(false);
    lastQuestion.current = null;
  }, []);

  const send = useCallback(
    async (text: string, forced: ForcedRoute | null) => {
      const question = text.trim();
      if (!question || busy) return;

      lastQuestion.current = { text: question, forced };
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const history = historyFor();
      setBusy(true);

      setMessages((prev) => [
        ...prev,
        { id: nextId(), author: 'user', body: question, createdAt: Date.now() },
      ]);

      // ---- routing ----
      announce(t(settings.lang, 'routerThinking'));
      let routing: RoutingDecision;
      if (forced) {
        routing = routeForced(question, settings.lang, forced);
      } else if (settings.routerEngine === 'rules') {
        routing = routeWithRules(question, settings.lang, personaOf(settings.persona).lead);
      } else {
        const lead = personaOf(settings.persona).lead;
        routing = await routeWithSarvam(question, settings.lang, lead).catch(() =>
          routeWithRules(question, settings.lang, lead),
        );
      }
      if (!routing.detectedLanguage) {
        routing.detectedLanguage = detectLanguage(question, settings.lang);
      }

      const lead = AGENTS[routing.primary];
      const sub = routing.subAgent ? SUB_AGENTS[routing.subAgent] : undefined;
      setActiveId(routing.primary);
      announce(
        `${t(settings.lang, 'routedTo')} ${lead.name}${sub ? `, ${sub.name}` : ''}. ${lead.role}.`,
        routing.urgency === 'emergency',
      );

      // ---- primary answer ----
      const primaryMsgId = nextId();
      setBusyIds([routing.primary]);
      setMessages((prev) => [
        ...prev,
        {
          id: primaryMsgId,
          author: routing.primary,
          body: '',
          createdAt: Date.now(),
          routing,
          subAgent: routing.subAgent,
          pending: true,
        },
      ]);

      const t0 = performance.now();
      try {
        const result =
          routing.primary === 'planner'
            ? await runPlanner({
                routing,
                settings,
                signal: controller.signal,
                // Parallel fan-out: every consulted teammate shows as busy at once.
                onPart: (agent, state) =>
                  setBusyIds((prev) =>
                    state === 'start'
                      ? [...new Set<AgentId>([...prev, agent])]
                      : prev.filter((x) => x !== agent),
                  ),
              })
            : await runAgent({
                id: routing.primary,
                question,
                routing,
                settings,
                history,
                signal: controller.signal,
              });
        patch(primaryMsgId, {
          ...result,
          pending: false,
          elapsedMs: Math.round(performance.now() - t0),
        });
        announce(`${lead.name} answered.`);
        onAnswer?.({
          id: primaryMsgId,
          author: routing.primary,
          createdAt: Date.now(),
          body: result.body,
        });
      } catch {
        if (!controller.signal.aborted) {
          patch(primaryMsgId, {
            pending: false,
            body: '',
            error: t(settings.lang, 'errorGeneric'),
          });
          announce(t(settings.lang, 'errorGeneric'), true);
        }
      }

      // ---- collaborators chime in, one at a time ----
      for (const collab of routing.collaborators) {
        if (controller.signal.aborted) break;
        const noteId = nextId();
        setBusyIds([collab]);
        setActiveId(collab);
        setMessages((prev) => [
          ...prev,
          {
            id: noteId,
            author: collab,
            body: '',
            createdAt: Date.now(),
            pending: true,
            handoff: {
              from: routing.primary,
              to: collab,
              why: `${AGENTS[collab].role} also applies here.`,
            },
          },
        ]);
        const c0 = performance.now();
        try {
          const note = await runCollaboratorNote({
            id: collab,
            primary: routing.primary,
            question,
            routing,
            settings,
            signal: controller.signal,
          });
          patch(noteId, { body: note, pending: false, elapsedMs: Math.round(performance.now() - c0) });
        } catch {
          patch(noteId, { pending: false, body: '', error: t(settings.lang, 'errorGeneric') });
        }
      }

      setBusyIds([]);
      setBusy(false);
    },
    [announce, busy, historyFor, onAnswer, patch, settings],
  );

  const retry = useCallback(() => {
    const last = lastQuestion.current;
    if (!last) return;
    // Drop the whole failed turn — send() re-adds the user's question.
    setMessages((prev) => {
      const fromEnd = [...prev].reverse().findIndex((m) => m.author === 'user');
      if (fromEnd === -1) return prev;
      return prev.slice(0, prev.length - fromEnd - 1);
    });
    void send(last.text, last.forced);
  }, [send]);

  return { messages, busy, busyIds, activeId, send, clear, retry };
}
