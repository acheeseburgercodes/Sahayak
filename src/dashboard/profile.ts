import type { PersonaId, Profile } from '../types';
import { personaOf } from './personas';

/** Persona-implied facts, overridden by anything the user actually said. */
export function effectiveProfile(persona: PersonaId | undefined, profile: Profile | undefined): Profile {
  return { ...(personaOf(persona).implied ?? {}), ...(profile ?? {}) };
}

/**
 * One line for the AI prompt. Deliberately coarse: no names, no ID numbers,
 * only what changes the advice (age band, area, card type, land, income band).
 */
export function profileSummary(persona: PersonaId | undefined, profile: Profile | undefined): string {
  const p = effectiveProfile(persona, profile);
  const facts: string[] = [];
  if (p.age != null) facts.push(`age about ${p.age}`);
  if (p.gender) facts.push(p.gender);
  if (p.area) facts.push(`${p.area} area`);
  if (p.rationCard) facts.push(p.rationCard === 'none' ? 'no ration card' : `${p.rationCard.toUpperCase()} ration card`);
  if (p.landHectares != null) facts.push(`${p.landHectares} ha of land`);
  if (p.income != null) facts.push(`household income about Rs ${p.income}/month`);
  if (p.disabilityPct) facts.push(`${p.disabilityPct}% disability`);
  if (p.pregnant) facts.push('pregnant');
  if (p.widow) facts.push('widow');
  if (p.student) facts.push('student');
  return `Dashboard profile: ${personaOf(persona).name.en}${facts.length ? ` (${facts.join(', ')})` : ''}. Tailor the answer to this, but do not assume anything they did not say.`;
}
