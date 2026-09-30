import type { AgentId, RoutingDecision } from '../types';
import { SUB_AGENTS, subAgentsOf } from './subAgents';
import { normalise, scoreTerms } from './scoring';

export interface SubPick {
  subAgent?: string;
  subScores?: RoutingDecision['subScores'];
  subEngine?: RoutingDecision['subEngine'];
}

/**
 * Second-stage router: once a teammate is chosen, pick the narrow specialist
 * inside it. Cheap, deterministic, and always runs — even when the LLM chose
 * the teammate — so the sub-agent is reproducible for the same text.
 */
export function pickSubAgent(parent: AgentId, text: string, forced?: string): SubPick {
  if (parent === 'router') return {};
  const subs = subAgentsOf(parent);
  if (subs.length === 0) return {};

  const hay = normalise(text);
  const subScores = subs
    .map((s) => ({ sub: s.id, score: Number(scoreTerms(hay, s.triggers).toFixed(2)) }))
    .sort((a, b) => b.score - a.score);

  if (forced && SUB_AGENTS[forced]?.parent === parent) {
    return { subAgent: forced, subScores, subEngine: 'forced' };
  }

  const top = subScores[0];
  if (top && top.score > 0) return { subAgent: top.sub, subScores, subEngine: 'rules' };
  // First entry of each list is the declared default.
  return { subAgent: subs[0].id, subScores, subEngine: 'default' };
}
