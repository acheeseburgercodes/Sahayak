import type { LangCode } from '../types';
import { langByCode } from '../i18n/languages';

/**
 * Sarvam AI client. Every request goes to the LOCAL proxy at /sarvam/* which
 * injects the `api-subscription-key` header server-side. The key is never
 * shipped to the browser — see server/proxy.mjs.
 */
const BASE = '/sarvam';

let available = false;
let probed = false;

/** Synchronous view of the last probe, for code paths that cannot await. */
export function sarvamAvailable(): boolean {
  return available;
}

export function sarvamProbed(): boolean {
  return probed;
}

/** Called once at startup. Never throws. */
export async function probeSarvam(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, { method: 'GET' });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { configured?: boolean };
    available = Boolean(body.configured);
  } catch {
    available = false;
  }
  probed = true;
  return available;
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sarvam ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------- chat

interface ChatArgs {
  system: string;
  user: string;
  /** Prior turns, oldest first, already trimmed by the caller. */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function sarvamChat(args: ChatArgs): Promise<string> {
  const data = await post<ChatResponse>(
    '/chat',
    {
      messages: [
        { role: 'system', content: args.system },
        ...(args.history ?? []),
        { role: 'user', content: args.user },
      ],
      temperature: args.temperature ?? 0.3,
      max_tokens: args.maxTokens ?? 900,
    },
    args.signal,
  );
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ----------------------------------------------------------- translate

interface TranslateResponse {
  translated_text?: string;
}

/**
 * Mayura translation. `mode: 'colloquial'` matters here — formal register is
 * exactly what a low-literacy user struggles with.
 */
export async function sarvamTranslate(
  text: string,
  from: LangCode | 'auto',
  to: LangCode,
  signal?: AbortSignal,
): Promise<string> {
  if (!available || !text.trim()) return text;
  if (from === to) return text;
  try {
    const data = await post<TranslateResponse>(
      '/translate',
      {
        input: text.slice(0, 1800),
        source_language_code: from === 'auto' ? 'auto' : from,
        target_language_code: to,
        mode: 'colloquial',
        speaker_gender: 'Female',
        enable_preprocessing: true,
      },
      signal,
    );
    return data.translated_text?.trim() || text;
  } catch {
    return text;
  }
}

// --------------------------------------------------------------- audio

interface TtsResponse {
  audios?: string[];
}

/** Returns a playable object URL, or null if TTS is unavailable. */
export async function sarvamSpeak(
  text: string,
  lang: LangCode,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!available) return null;
  try {
    const data = await post<TtsResponse>(
      '/tts',
      {
        text: stripMarkup(text).slice(0, 1400),
        target_language_code: lang,
        speaker: langByCode(lang).voice,
        pace: 0.95,
        loudness: 1.1,
      },
      signal,
    );
    const b64 = data.audios?.[0];
    if (!b64) return null;
    return URL.createObjectURL(base64ToBlob(b64, 'audio/wav'));
  } catch {
    return null;
  }
}

interface SttResponse {
  transcript?: string;
  language_code?: string;
}

/** Saarika speech-to-text over a recorded blob. */
export async function sarvamTranscribe(
  blob: Blob,
  lang: LangCode,
): Promise<{ text: string; lang?: LangCode } | null> {
  if (!available) return null;
  try {
    const form = new FormData();
    form.append('file', blob, 'speech.webm');
    form.append('language_code', lang);
    const res = await fetch(`${BASE}/stt`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as SttResponse;
    if (!data.transcript) return null;
    return { text: data.transcript, lang: data.language_code as LangCode | undefined };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------- helpers

function base64ToBlob(b64: string, type: string): Blob {
  const bytes = atob(b64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type });
}

/** TTS should not read asterisks and hashes aloud. */
export function stripMarkup(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`]/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}
