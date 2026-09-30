import type { LangCode } from '../types';

/** Unicode block probes, ordered so the most distinctive script wins. */
const SCRIPTS: Array<[LangCode, RegExp]> = [
  ['bn-IN', /[\u0980-\u09FF]/],
  ['ta-IN', /[\u0B80-\u0BFF]/],
  ['te-IN', /[\u0C00-\u0C7F]/],
  ['kn-IN', /[\u0C80-\u0CFF]/],
  ['ml-IN', /[\u0D00-\u0D7F]/],
  ['gu-IN', /[\u0A80-\u0AFF]/],
  ['pa-IN', /[\u0A00-\u0A7F]/],
  ['or-IN', /[\u0B00-\u0B7F]/],
  // Devanagari is shared by Hindi and Marathi — disambiguated below.
  ['hi-IN', /[\u0900-\u097F]/],
];

/** Marathi-only function words, used to split Marathi from Hindi. */
const MARATHI_HINTS = ['आहे', 'नाही', 'माझ', 'तुम्ही', 'मला', 'काय', 'कुठे', 'पाहिजे', 'करा'];

/**
 * Cheap, offline script-based language detection. Good enough to pick the
 * reply language and the TTS voice; Sarvam's own detection refines it when a
 * key is configured.
 */
export function detectLanguage(text: string, fallback: LangCode): LangCode {
  for (const [code, re] of SCRIPTS) {
    if (!re.test(text)) continue;
    if (code === 'hi-IN' && MARATHI_HINTS.some((w) => text.includes(w))) return 'mr-IN';
    return code;
  }
  // Latin script: could be English or romanised Hindi ("mera ration card").
  if (/[a-z]/i.test(text) && ROMAN_HINDI.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text))) {
    return 'hi-IN';
  }
  return /[a-z]/i.test(text) ? 'en-IN' : fallback;
}

const ROMAN_HINDI = [
  'mera', 'meri', 'mujhe', 'kya', 'kaise', 'kahan', 'nahi', 'nahin', 'hai', 'hain',
  'chahiye', 'karo', 'kar', 'diya', 'paisa', 'paise', 'kaam', 'ghar', 'aaj', 'kal',
  'bhai', 'didi', 'madad', 'jaldi', 'sarkari',
];
