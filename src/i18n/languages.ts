import type { Language, LangCode } from '../types';

/**
 * Sarvam AI's supported Indic languages. `voice` maps to a bulbul speaker.
 * Order puts Hindi + English first, then by speaker population.
 */
export const LANGUAGES: Language[] = [
  { code: 'hi-IN', native: 'हिन्दी', english: 'Hindi', region: 'North India', voice: 'anushka' },
  { code: 'en-IN', native: 'English', english: 'English', region: 'Pan-India', voice: 'anushka' },
  { code: 'bn-IN', native: 'বাংলা', english: 'Bengali', region: 'West Bengal, Tripura', voice: 'manisha' },
  { code: 'mr-IN', native: 'मराठी', english: 'Marathi', region: 'Maharashtra', voice: 'vidya' },
  { code: 'te-IN', native: 'తెలుగు', english: 'Telugu', region: 'Andhra, Telangana', voice: 'manisha' },
  { code: 'ta-IN', native: 'தமிழ்', english: 'Tamil', region: 'Tamil Nadu', voice: 'vidya' },
  { code: 'gu-IN', native: 'ગુજરાતી', english: 'Gujarati', region: 'Gujarat', voice: 'anushka' },
  { code: 'kn-IN', native: 'ಕನ್ನಡ', english: 'Kannada', region: 'Karnataka', voice: 'manisha' },
  { code: 'ml-IN', native: 'മലയാളം', english: 'Malayalam', region: 'Kerala', voice: 'vidya' },
  { code: 'pa-IN', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', region: 'Punjab', voice: 'anushka' },
  { code: 'or-IN', native: 'ଓଡ଼ିଆ', english: 'Odia', region: 'Odisha', voice: 'manisha' },
];

export function langByCode(code: LangCode): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[1];
}

/** Web Speech API locale, for the free fallback STT/TTS path. */
export function webSpeechLocale(code: LangCode): string {
  return code;
}
