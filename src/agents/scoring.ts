/** Shared keyword scoring, used by both the teammate router and the sub-router. */

export function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `;
}

/** Longer triggers are more diagnostic, so weight by term length. */
export function scoreTerms(haystack: string, triggers: Iterable<string>): number {
  let score = 0;
  for (const trigger of triggers) {
    if (!haystack.includes(trigger)) continue;
    const words = trigger.split(' ').length;
    score += 1 + (words - 1) * 1.5 + Math.min(trigger.length, 14) / 14;
  }
  return score;
}
