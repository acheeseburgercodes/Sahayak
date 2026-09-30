/**
 * Android-only direct Sarvam transport.
 *
 * On a phone there is no local proxy, so this module does what
 * server/proxy.mjs does: map Sahayak's small `/chat|/translate|/tts|/stt`
 * contract onto the upstream Sarvam endpoints and add the key header.
 * CapacitorHttp (enabled in capacitor.config.ts) routes fetch through the
 * native HTTP stack, so upstream CORS does not apply.
 *
 * Keep the request shapes in step with server/proxy.mjs and electron/sarvam.mjs.
 */
const SARVAM = 'https://api.sarvam.ai';
const CHAT_MODEL = 'sarvam-m';

type Body = Record<string, unknown>;

function upstream(path: string, b: Body): { url: string; body: Body } {
  switch (path) {
    case '/chat':
      return {
        url: `${SARVAM}/v1/chat/completions`,
        body: {
          model: CHAT_MODEL,
          messages: b.messages,
          temperature: b.temperature ?? 0.3,
          max_tokens: b.max_tokens ?? 900,
        },
      };
    case '/translate':
      return {
        url: `${SARVAM}/translate`,
        body: {
          input: b.input,
          source_language_code: b.source_language_code ?? 'auto',
          target_language_code: b.target_language_code,
          mode: b.mode ?? 'colloquial',
          speaker_gender: b.speaker_gender ?? 'Female',
          enable_preprocessing: b.enable_preprocessing ?? true,
          model: 'mayura:v1',
        },
      };
    case '/tts':
      return {
        url: `${SARVAM}/text-to-speech`,
        body: {
          inputs: [String(b.text ?? '').slice(0, 1500)],
          target_language_code: b.target_language_code,
          speaker: b.speaker ?? 'anushka',
          pace: b.pace ?? 1,
          loudness: b.loudness ?? 1,
          speech_sample_rate: 22050,
          model: 'bulbul:v2',
        },
      };
    default:
      throw new Error(`Unknown Sarvam route ${path}`);
  }
}

export async function directJson(
  path: string,
  body: Body,
  key: string,
  signal?: AbortSignal,
): Promise<Response> {
  const { url, body: up } = upstream(path, body);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': key },
    body: JSON.stringify(up),
    signal,
  });
}

export async function directStt(form: FormData, key: string): Promise<Response> {
  return fetch(`${SARVAM}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': key },
    body: form,
  });
}
