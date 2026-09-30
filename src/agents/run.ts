import type {
  ActionStep,
  AgentId,
  LangCode,
  ResourceCard,
  RoutingDecision,
  Settings,
  ToolRun,
  WorkerId,
} from '../types';
import { AGENTS } from './registry';
import { SUB_AGENTS } from './subAgents';
import { demoAnswer } from './demoAnswers';
import { runTools } from './tools';
import { helplinesFor, nearest } from '../lib/data';
import { sarvamAvailable, sarvamChat, sarvamTranslate } from '../lib/sarvam';
import { langByCode } from '../i18n/languages';
import { profileSummary } from '../dashboard/profile';

export interface AgentResult {
  body: string;
  steps?: ActionStep[];
  resources?: ResourceCard[];
  helplines?: ResourceCard[];
  tools?: ToolRun[];
  subAgent?: string;
}

/** Which resource kinds each agent attaches to its answer. */
const ATTACH: Record<WorkerId, ResourceCard['kind'][]> = {
  emergency: ['hospital'],
  ration: ['ration-shop', 'office'],
  shelter: ['shelter'],
  health: ['hospital'],
  livelihood: ['office'],
  documents: ['office'],
  money: ['office'],
  grievance: ['office'],
  farmer: ['office'],
  education: ['office'],
  enterprise: ['office'],
  // Advanced bots: a scam verdict or a number does not need a map.
  scam: [],
  calculator: [],
  planner: [],
};

function contextBlock(settings: Settings, routing: RoutingDecision, kinds: ResourceCard['kind'][]): string {
  const { place } = settings;
  const lang = langByCode(routing.detectedLanguage ?? settings.lang);
  const local = kinds.length ? nearest(kinds, place, 4) : [];

  const directory = local
    .map(
      (r) =>
        `- ${r.name} (${r.kind}) — ${r.detail}${r.address ? ` | Address: ${r.address}` : ''}${
          r.hours ? ` | Hours: ${r.hours}` : ''
        }${r.phone ? ` | Phone: ${r.phone}` : ''}${
          r.distanceKm != null ? ` | ${r.distanceKm} km away` : ''
        }`,
    )
    .join('\n');

  return `
USER CONTEXT
- Location: ${place.label}, ${place.district} district, ${place.state}.
- Reply language: ${lang.english} (${lang.code}). Write the whole answer in this language.
- Urgency assessed by the router: ${routing.urgency}.
- ${profileSummary(settings.persona, settings.profile)}
${settings.simpleLanguage ? '- The user has asked for VERY SIMPLE words. Short sentences, no official jargon, no English loanwords where a common word exists.' : ''}

LOCAL DIRECTORY (use these exact names, addresses and hours; do not invent others)
${directory || '- No local directory rows available. Say you do not have the local address and name the office type plus the national helpline.'}

Format: short paragraphs and numbered steps. Bold the single most important
action. Never exceed 300 words.`.trim();
}

/** Trim chat history to the last few turns so prompts stay small and cheap. */
export function trimHistory(
  turns: Array<{ role: 'user' | 'assistant'; content: string }>,
  keep = 6,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return turns.slice(-keep).map((t) => ({ ...t, content: t.content.slice(0, 1200) }));
}

function subBlock(subId: string | undefined): string {
  const sub = subId ? SUB_AGENTS[subId] : undefined;
  return sub ? `\n\nSPECIALIST FOCUS — ${sub.name}: ${sub.system}` : '';
}

function subTip(subId: string | undefined, lang: LangCode): string {
  const sub = subId ? SUB_AGENTS[subId] : undefined;
  if (!sub) return '';
  return lang === 'hi-IN' ? sub.tip.hi : sub.tip.en;
}

export async function runAgent(opts: {
  id: AgentId;
  question: string;
  routing: RoutingDecision;
  settings: Settings;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  signal?: AbortSignal;
}): Promise<AgentResult> {
  const { id, question, routing, settings, history, signal } = opts;
  const spec = AGENTS[id];
  const lang: LangCode = routing.detectedLanguage ?? settings.lang;
  const kinds = ATTACH[id as WorkerId] ?? ['office'];
  const subId = routing.primary === id ? routing.subAgent : undefined;

  // Deterministic tools run first, in every mode: their output is the answer's
  // spine and the model only gets to explain it.
  const tool = runTools(id, subId, question, lang);
  const demo = demoAnswer(id, lang);
  const structured = {
    steps: demo.steps,
    resources: kinds.length ? nearest(kinds, settings.place, 3) : undefined,
    helplines: helplinesFor(demo.helplines ?? []),
    tools: tool?.runs,
    subAgent: subId,
  };

  if (sarvamAvailable()) {
    const body = await sarvamChat({
      system: `${spec.system}${subBlock(subId)}${tool ? `\n\nTOOL RESULTS\n${tool.facts}` : ''}\n\n${contextBlock(settings, routing, kinds)}`,
      user: question,
      history: history ? trimHistory(history) : undefined,
      temperature: routing.urgency === 'emergency' || tool ? 0.1 : 0.35,
      maxTokens: routing.urgency === 'emergency' ? 420 : 900,
      signal,
    });
    if (body) {
      // The tool's own report stays on top, so the verdict / number the user
      // sees can never be something the model paraphrased wrongly.
      return { ...structured, body: tool ? `${tool.report}\n\n${body}` : body };
    }
  }

  // ------- offline / demo path -------
  let body = demo.body;
  const tip = subTip(subId, lang);
  if (tip && id !== 'calculator') body = `${body}\n\n**💡** ${tip}`;
  if (tool) body = `${tool.report}\n\n${body}${id === 'calculator' && tip ? `\n\n**💡** ${tip}` : ''}`;

  // If the language has no hand-written demo text, try a live translation of
  // the English version; if that is unavailable too, English is the honest
  // fallback rather than silently wrong text.
  if (lang !== 'en-IN' && lang !== 'hi-IN' && sarvamAvailable()) {
    body = await sarvamTranslate(body, 'en-IN', lang, signal);
  }

  return { ...structured, body };
}

const NOTE_LIMIT = 90;

/**
 * A collaborator's short addition — the "teammate chiming in" behaviour rather
 * than a second full answer. Also used by the planner for each part.
 */
export async function runCollaboratorNote(opts: {
  id: AgentId;
  primary: AgentId;
  question: string;
  routing: RoutingDecision;
  settings: Settings;
  sub?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const { id, primary, question, routing, settings, sub, signal } = opts;
  const spec = AGENTS[id];
  const lang: LangCode = routing.detectedLanguage ?? settings.lang;

  if (sarvamAvailable()) {
    const body = await sarvamChat({
      system: `${spec.system}${subBlock(sub)}

You are chiming in as a TEAMMATE. ${AGENTS[primary].name} is leading on
${AGENTS[primary].role.toLowerCase()}. Add ONLY the one thing from your own area
that changes what the person does next. Maximum ${NOTE_LIMIT} words. No greeting,
no summary, no repetition. Write in ${langByCode(lang).english}.`,
      user: question,
      temperature: 0.3,
      maxTokens: 220,
      signal,
    });
    if (body) return body;
  }

  // Offline: the sub-agent's tip is the most specific thing we have.
  const tip = subTip(sub, lang);
  if (tip) return tip;
  const demo = demoAnswer(id, lang);
  const firstPara = demo.body.split('\n\n')[0] ?? demo.body;
  return firstPara.split(/(?<=[।.])\s/).slice(0, 2).join(' ');
}

/** Life and food first, then money, then paperwork. */
const PRIORITY: WorkerId[] = [
  'emergency', 'shelter', 'health', 'ration', 'money', 'livelihood', 'farmer', 'enterprise',
  'grievance', 'documents', 'education',
];

/**
 * The planner: fans each part out to its teammate IN PARALLEL, then merges the
 * notes into one ordered plan. `onPart` lets the UI light up each teammate as
 * it starts and finishes.
 */
export async function runPlanner(opts: {
  routing: RoutingDecision;
  settings: Settings;
  signal?: AbortSignal;
  onPart?: (agent: WorkerId, state: 'start' | 'done') => void;
}): Promise<AgentResult> {
  const { routing, settings, signal, onPart } = opts;
  const lang: LangCode = routing.detectedLanguage ?? settings.lang;
  const plan = [...(routing.plan ?? [])].sort(
    (a, b) => PRIORITY.indexOf(a.agent) - PRIORITY.indexOf(b.agent),
  );
  const demo = demoAnswer('planner', lang);

  if (plan.length === 0) {
    return {
      body:
        lang === 'hi-IN'
          ? 'अपनी हर परेशानी अलग-अलग बताइए — जैसे "घर बाढ़ में गया, राशन कार्ड खो गया, मज़दूरी नहीं मिली" — तो मैं हर एक के लिए सही साथी से पूछकर एक योजना बनाऊँगा।'
          : 'Tell me each problem separately — for example "flood took the house, ration card is lost, wages not paid" — and I will ask the right teammate for each and build one plan.',
    };
  }

  const started = performance.now();
  const notes = await Promise.all(
    plan.map(async (p) => {
      onPart?.(p.agent, 'start');
      const t0 = performance.now();
      const note = await runCollaboratorNote({
        id: p.agent,
        primary: 'planner',
        question: p.part,
        routing: { ...routing, primary: p.agent, subAgent: p.sub },
        settings,
        sub: p.sub,
        signal,
      }).catch(() => '');
      onPart?.(p.agent, 'done');
      return { ...p, note, ms: Math.round(performance.now() - t0) };
    }),
  );

  const tools: ToolRun[] = notes.map((n) => ({
    name: `ask ${n.sub ?? n.agent}`,
    input: n.part,
    output: `${n.note.slice(0, 140)}${n.note.length > 140 ? '…' : ''} (${n.ms} ms)`,
  }));
  tools.push({
    name: 'merge',
    input: `${notes.length} parts, priority ${notes.map((n) => n.agent).join(' → ')}`,
    output: `${Math.round(performance.now() - started)} ms wall-clock (parallel)`,
  });

  const merged = notes
    .map((n, i) => `${i + 1}. **${AGENTS[n.agent].emoji} ${AGENTS[n.agent].name}:** ${n.note.replace(/\n+/g, ' ')}`)
    .join('\n');

  if (sarvamAvailable()) {
    const body = await sarvamChat({
      system: `${AGENTS.planner.system}

TEAMMATE NOTES (in priority order)
${notes.map((n) => `- ${AGENTS[n.agent].name} on "${n.part}": ${n.note}`).join('\n')}

Write in ${langByCode(lang).english}.`,
      user: plan.map((p) => p.part).join('; '),
      temperature: 0.2,
      maxTokens: 700,
      signal,
    }).catch(() => '');
    if (body) return { body, tools, helplines: helplinesFor(demo.helplines ?? []) };
  }

  return {
    body: `${demo.body}\n\n${merged}`,
    tools,
    helplines: helplinesFor(demo.helplines ?? []),
  };
}
