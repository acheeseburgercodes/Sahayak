import type { AgentId, ForcedRoute, LangCode, RoutingDecision, Urgency, WorkerId } from '../types';
import { AGENTS, AGENT_ORDER, CORE_ORDER } from './registry';
import { MULTILINGUAL_TRIGGERS } from './multilingualTriggers';
import { detectLanguage } from './language';
import { sarvamAvailable, sarvamChat } from '../lib/sarvam';
import { normalise, scoreTerms as scoreAgent } from './scoring';
import { pickSubAgent } from './subRouter';

/** Terms that force `emergency` to the front regardless of topic scoring. */
const LIFE_RISK = [
  'dying', 'not breathing', 'not waking', 'unconscious', 'bleeding', 'suicide',
  'kill myself', 'drowning', 'trapped', 'buried', 'fire', 'burning', 'snake bite',
  'electric shock', 'fell from the roof', 'fell from roof',
  'मर रहा', 'सांस नहीं', 'साँस नहीं', 'बेहोश', 'होश में नहीं', 'होश नहीं', 'खून बह',
  'आत्महत्या', 'डूब', 'दब गया', 'दब गए', 'आग लग', 'सांप ने काटा', 'साँप ने काटा', 'करंट',
  'hosh nahi', 'behosh', 'saans nahi',
];

const TIME_SENSITIVE = [
  'today', 'tonight', 'right now', 'immediately', 'no food', 'nothing to eat',
  'rising', 'tomorrow morning', 'closing', 'last date', 'deadline',
  'आज', 'आज रात', 'अभी', 'तुरंत', 'खाना नहीं', 'बढ़ रहा', 'आखिरी तारीख',
];

/**
 * Merged trigger set per agent, built once. A term listed in BOTH the registry
 * and the cross-script table must score once, not twice — the duplicate was
 * letting a generic word ("काम") outrank a diagnostic one ("रिश्वत").
 */
const TRIGGER_SETS: Record<AgentId, Set<string>> = Object.fromEntries(
  AGENT_ORDER.map((id) => [
    id,
    new Set([...AGENTS[id].triggers, ...(MULTILINGUAL_TRIGGERS[id] ?? [])]),
  ]),
) as Record<AgentId, Set<string>>;

export function detectUrgency(text: string): Urgency {
  const hay = normalise(text);
  if (LIFE_RISK.some((t) => hay.includes(t))) return 'emergency';
  if (TIME_SENSITIVE.some((t) => hay.includes(t))) return 'time-sensitive';
  return 'routine';
}

/**
 * Deterministic, offline router. Runs on every message — it is the fallback
 * when Sarvam is unavailable, and the prior the LLM router has to beat.
 */
export function routeWithRules(text: string, fallbackLang: LangCode, personaLead?: WorkerId): RoutingDecision {
  return finalise(routeTeammate(text, fallbackLang, personaLead), text);
}

/**
 * A route the user chose by hand (pinned teammate, or a developer-picked
 * sub-agent), or one implied by the dashboard card they asked from. Urgency is
 * still assessed so a life-risk message is flagged — and a dashboard question
 * that turns out to be a life risk goes to the emergency responder anyway.
 */
export function routeForced(text: string, fallbackLang: LangCode, forced: ForcedRoute): RoutingDecision {
  const rules = routeTeammate(text, fallbackLang);

  if (forced.origin === 'dashboard') {
    if (rules.urgency === 'emergency') return finalise(rules, text);
    const collaborators = AGENTS[forced.agent].collaborators
      .filter((c) => c !== forced.agent)
      .slice(0, 1);
    return {
      ...rules,
      primary: forced.agent,
      collaborators,
      confidence: 0.95,
      rationale: `Asked from the ${forced.label ?? 'dashboard'} card, so ${AGENTS[forced.agent].name} leads${
        collaborators.length ? ` and ${AGENTS[collaborators[0]].name} joins` : ''
      }.`,
      engine: 'dashboard',
      ...pickSubAgent(forced.agent, text, forced.sub),
    };
  }

  const plan = forced.agent === 'planner' ? planParts(text) : undefined;
  return {
    ...rules,
    primary: forced.agent,
    collaborators: [],
    confidence: 1,
    rationale: forced.sub
      ? `Developer route: ${AGENTS[forced.agent].name} › ${forced.sub}. Router skipped.`
      : `You pinned ${AGENTS[forced.agent].name}, so the router was skipped.`,
    engine: 'rules',
    plan,
    ...pickSubAgent(forced.agent, text, forced.sub),
  };
}

// ---------------------------------------------------------------------------
// Planner: split a multi-problem message into parts, one teammate per part.
// ---------------------------------------------------------------------------

const SPLIT = /[,;।.!?\n]+|\s(?:and|also|then|plus|but|aur|और|तथा|फिर|लेकिन|पर)\s/i;

export function planParts(text: string): NonNullable<RoutingDecision['plan']> {
  const clauses = text
    .split(SPLIT)
    .map((c) => c.trim())
    .filter((c) => c.length >= 6);

  const byAgent = new Map<WorkerId, string[]>();
  for (const clause of clauses) {
    const hay = normalise(clause);
    let best: { agent: WorkerId; score: number } | null = null;
    for (const id of CORE_ORDER as WorkerId[]) {
      const score = scoreAgent(hay, TRIGGER_SETS[id]);
      if (score >= 1 && (!best || score > best.score)) best = { agent: id, score };
    }
    if (!best) continue;
    byAgent.set(best.agent, [...(byAgent.get(best.agent) ?? []), clause]);
  }

  return [...byAgent.entries()].slice(0, 5).map(([agent, parts]) => {
    const part = parts.join('; ');
    return { part, agent, sub: pickSubAgent(agent, part).subAgent };
  });
}

/** Distinct problems needed before the router hands the whole message to the planner. */
const AUTO_PLAN_MIN = 3;

/** Topics whose "how much" questions the calculator can answer exactly. */
const NUMERIC_TOPICS: AgentId[] = ['ration', 'livelihood', 'money'];

function finalise(decision: RoutingDecision, text: string): RoutingDecision {
  let d = decision;

  // "How much…" with actual numbers in it is a calculation, even when the
  // topic words (ration, wages, loan) outscore the calculator's own triggers.
  const calcScore = d.scores.find((x) => x.agent === 'calculator')?.score ?? 0;
  if (
    d.urgency !== 'emergency' &&
    calcScore > 0 &&
    NUMERIC_TOPICS.includes(d.primary) &&
    /[0-9०-९]/.test(text)
  ) {
    d = {
      ...d,
      primary: 'calculator',
      collaborators: [d.primary],
      rationale: `Asked for a number with figures given, so Hisaab calculates and ${AGENTS[d.primary].name} follows up.`,
    };
  }

  if (d.urgency !== 'emergency') {
    const plan = planParts(text);
    const wantsPlan = d.primary === 'planner' || plan.length >= AUTO_PLAN_MIN;
    if (wantsPlan && plan.length >= 2) {
      d = {
        ...d,
        primary: 'planner',
        collaborators: [],
        plan,
        confidence: Math.max(d.confidence, 0.7),
        rationale: `Found ${plan.length} separate problems (${plan
          .map((p) => AGENTS[p.agent].name)
          .join(', ')}), so the planner asks each teammate in parallel and merges one plan.`,
      };
    } else if (d.primary === 'planner') {
      // Planner wording but only one real problem: give it to that specialist.
      const next = d.scores.find((s) => s.agent !== 'planner' && s.score > 0);
      const primary: AgentId = plan[0]?.agent ?? next?.agent ?? 'documents';
      d = {
        ...d,
        primary,
        collaborators: AGENTS[primary].collaborators.filter((c) => c !== primary).slice(0, 1),
        rationale: `Asked for a plan, but only one problem was found, so ${AGENTS[primary].name} answers directly.`,
      };
    }
  } else if (d.primary === 'planner') {
    d = { ...d, primary: 'emergency', collaborators: AGENTS.emergency.collaborators.slice(0, 1) };
  }

  return { ...d, ...pickSubAgent(d.primary, text) };
}

/** Below this top score a question is "generic" and the persona lead may take it. */
const WEAK_MATCH = 2.5;
const PERSONA_BONUS = 1.5;

function routeTeammate(text: string, fallbackLang: LangCode, personaLead?: WorkerId): RoutingDecision {
  const hay = normalise(text);
  const urgency = detectUrgency(text);

  const scores = AGENT_ORDER.map((id) => ({
    agent: id,
    score: scoreAgent(hay, TRIGGER_SETS[id]),
  })).sort((a, b) => b.score - a.score);

  // A life-risk phrase overrides topical scoring outright.
  if (urgency === 'emergency') {
    const idx = scores.findIndex((s) => s.agent === 'emergency');
    if (idx > 0) {
      const [em] = scores.splice(idx, 1);
      em.score += 10;
      scores.unshift(em);
    }
  } else if (personaLead && (scores[0]?.score ?? 0) < WEAK_MATCH) {
    // Only generic words matched ("apply", "scheme"): the dashboard persona's
    // lead is a better first responder than the generalist. A strong topical
    // match is never overridden.
    const lead = scores.find((s) => s.agent === personaLead);
    if (lead && (scores[0]?.score ?? 0) > 0) {
      lead.score += PERSONA_BONUS;
      scores.sort((a, b) => b.score - a.score);
    }
  }

  const top = scores[0];
  const runnerUp = scores[1];
  const total = scores.reduce((sum, s) => sum + s.score, 0);

  // Nothing matched: the dashboard persona's lead teammate is the best guess
  // ("how do I apply?" from a farmer means a farm scheme); without a persona,
  // documents is the safest generalist for scheme questions.
  if (!top || top.score === 0) {
    const lead: WorkerId = personaLead ?? 'documents';
    return {
      primary: lead,
      collaborators: lead === 'documents' ? ['ration', 'grievance'] : ['documents'],
      urgency,
      confidence: 0.25,
      rationale: personaLead
        ? `No strong keyword match. Your dashboard is set to a profile ${AGENTS[lead].name} serves, so ${AGENTS[lead].name} starts and can hand off.`
        : 'No strong keyword match. Sent to the documents & schemes generalist, who can hand off.',
      engine: 'fallback',
      scores,
      detectedLanguage: detectLanguage(text, fallbackLang),
    };
  }

  const confidence = Math.max(
    0.3,
    Math.min(0.97, total === 0 ? 0.3 : (top.score - (runnerUp?.score ?? 0) * 0.6) / top.score),
  );

  // Collaborators: whoever also scored, plus the agent's declared partners.
  // At least one declared partner is always pulled in — the "teammates" model
  // is the point of the platform, and a single specialist answering alone is
  // exactly how a person ends up solving one third of their problem.
  const alsoScored = scores
    .slice(1)
    .filter((s) => s.score >= Math.max(1.5, top.score * 0.35))
    .map((s) => s.agent);

  const declared = AGENTS[top.agent].collaborators;
  const maxCollaborators = confidence >= 0.6 ? 1 : 2;

  const collaborators = dedupe([...alsoScored, ...declared])
    .filter((id) => id !== top.agent)
    .slice(0, maxCollaborators);

  // A life-risk phrase always gets the emergency responder in the thread.
  if (urgency === 'emergency' && top.agent !== 'emergency' && !collaborators.includes('emergency')) {
    collaborators.unshift('emergency');
    collaborators.length = Math.min(collaborators.length, 2);
  }

  return {
    primary: top.agent,
    collaborators,
    urgency,
    confidence,
    rationale: `Matched ${AGENTS[top.agent].role.toLowerCase()} terms (score ${top.score.toFixed(1)}${
      runnerUp && runnerUp.score > 0 ? `, next best ${AGENTS[runnerUp.agent].name} ${runnerUp.score.toFixed(1)}` : ''
    }).`,
    engine: 'rules',
    scores,
    detectedLanguage: detectLanguage(text, fallbackLang),
  };
}

const ROUTER_SYSTEM = `You are the router of Sahayak, a team of AI helpers for
low-income people in India. Read the user's problem and choose which teammate
handles it. Reply with STRICT JSON and nothing else.

Teammates:
- emergency: life-threatening now — accident, fire, violence, ambulance, missing child, trapped
- ration: food, ration card, PDS shops, free grain, hunger
- shelter: floods, earthquakes, relief camps, night shelters, homelessness, evacuation
- health: illness, hospitals, medicines, pregnancy, Ayushman card, mental health
- livelihood: work, wages, MGNREGA, unpaid salary, migrant labour rights
- documents: Aadhaar, certificates, pensions, applying for any scheme, lost papers
- money: debt, moneylenders, bank accounts, fraud, subsidy not credited
- grievance: an office refused them, bribes, complaints, RTI, legal aid, FIR
- farmer: farming, crops, PM-KISAN, crop insurance, Kisan Credit Card, soil, mandi/MSP, livestock
- education: scholarships, school admission / RTE free seats, skill training, apprenticeships
- enterprise: street vendors, traditional artisans, small business loans (SVANidhi, Vishwakarma, Mudra)
- scam: "is this message / call / offer real?" — checking a suspected fraud BEFORE money is lost
- calculator: the user wants a NUMBER worked out — grain owed, wages due, loan interest
- planner: the message describes THREE OR MORE separate problems at once

Money already stolen goes to "money", not "scam".

JSON shape:
{"primary":"<id>","collaborators":["<id>"],"urgency":"routine|time-sensitive|emergency","confidence":0.0-1.0,"rationale":"one short sentence","language":"<bcp47 like hi-IN>"}

Rules: at most 2 collaborators. If there is any risk to life, primary MUST be
"emergency". Pick collaborators only when they genuinely add something.`;

const VALID: AgentId[] = [...AGENT_ORDER];

/**
 * LLM router. Falls back to the rules decision on any failure, and keeps the
 * rules `scores` array so the transparency panel always has something to show.
 */
export async function routeWithSarvam(
  text: string,
  fallbackLang: LangCode,
  personaLead?: WorkerId,
): Promise<RoutingDecision> {
  const rules = routeWithRules(text, fallbackLang, personaLead);
  if (!sarvamAvailable()) return rules;

  try {
    const raw = await sarvamChat({
      system: ROUTER_SYSTEM,
      user: text,
      temperature: 0,
      maxTokens: 220,
    });

    const json = extractJson(raw);
    if (!json) return rules;

    const primary = VALID.includes(json.primary as AgentId) ? (json.primary as AgentId) : rules.primary;
    const collaborators = Array.isArray(json.collaborators)
      ? dedupe(json.collaborators.filter((c: unknown): c is AgentId => VALID.includes(c as AgentId)))
          .filter((c) => c !== primary)
          .slice(0, 2)
      : rules.collaborators;

    // Rules keep veto power on life risk — the model is not allowed to downgrade it.
    const urgency: Urgency =
      rules.urgency === 'emergency'
        ? 'emergency'
        : (['routine', 'time-sensitive', 'emergency'] as string[]).includes(String(json.urgency))
          ? (json.urgency as Urgency)
          : rules.urgency;

    return finalise({
      primary: urgency === 'emergency' && primary !== 'emergency' ? 'emergency' : primary,
      collaborators:
        urgency === 'emergency' && primary !== 'emergency'
          ? dedupe([primary, ...collaborators]).slice(0, 2)
          : collaborators,
      urgency,
      confidence: clamp01(Number(json.confidence) || rules.confidence),
      rationale: String(json.rationale || rules.rationale).slice(0, 220),
      engine: 'sarvam-llm',
      scores: rules.scores,
      detectedLanguage: (json.language as LangCode) || rules.detectedLanguage,
    }, text);
  } catch {
    return rules;
  }
}

function extractJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}
