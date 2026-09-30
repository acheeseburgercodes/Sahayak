/**
 * Desktop Sarvam bridge: the same /chat, /translate, /tts, /stt contract as
 * server/proxy.mjs, implemented on node:http so the packaged app needs no
 * Express. Keep request shapes in step with server/proxy.mjs and
 * src/lib/sarvamDirect.ts.
 */
const SARVAM = 'https://api.sarvam.ai';
const CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-m';

// Per-process token bucket so a runaway render loop cannot burn the quota.
const LIMIT = 60;
const WINDOW_MS = 60_000;
let bucket = { count: 0, reset: Date.now() + WINDOW_MS };

function send(res, status, obj) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function mapJson(route, b) {
  switch (route) {
    case '/chat':
      if (!Array.isArray(b.messages) || b.messages.length === 0) return null;
      return [
        '/v1/chat/completions',
        { model: CHAT_MODEL, messages: b.messages, temperature: b.temperature ?? 0.3, max_tokens: b.max_tokens ?? 900 },
      ];
    case '/translate':
      if (!b.input || !b.target_language_code) return null;
      return [
        '/translate',
        {
          input: b.input,
          source_language_code: b.source_language_code ?? 'auto',
          target_language_code: b.target_language_code,
          mode: b.mode ?? 'colloquial',
          speaker_gender: b.speaker_gender ?? 'Female',
          enable_preprocessing: b.enable_preprocessing ?? true,
          model: process.env.SARVAM_TRANSLATE_MODEL || 'mayura:v1',
        },
      ];
    case '/tts':
      if (!b.text || !b.target_language_code) return null;
      return [
        '/text-to-speech',
        {
          inputs: [String(b.text).slice(0, 1500)],
          target_language_code: b.target_language_code,
          speaker: b.speaker ?? 'anushka',
          pace: b.pace ?? 1,
          loudness: b.loudness ?? 1,
          speech_sample_rate: 22050,
          model: process.env.SARVAM_TTS_MODEL || 'bulbul:v2',
        },
      ];
    default:
      return undefined;
  }
}

async function forward(res, url, init, label) {
  try {
    const up = await fetch(url, init);
    const text = await up.text();
    if (!up.ok) console.error(`[sarvam:${label}] ${up.status} ${text.slice(0, 300)}`);
    return send(res, up.status, text || JSON.stringify({ error: `${label} failed` }));
  } catch (err) {
    console.error(`[sarvam:${label}] network error`, err?.message);
    return send(res, 502, { error: `Could not reach Sarvam (${label}).` });
  }
}

/**
 * @param {string} route   path after /sarvam, e.g. "/chat"
 * @param {() => string} getKey
 */
export async function handleSarvam(route, req, res, getKey) {
  const key = getKey();
  if (route === '/health' && req.method === 'GET') {
    return send(res, 200, { ok: true, configured: Boolean(key), model: CHAT_MODEL, shell: 'desktop' });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  const now = Date.now();
  if (now > bucket.reset) bucket = { count: 0, reset: now + WINDOW_MS };
  bucket.count += 1;
  if (bucket.count > LIMIT) return send(res, 429, { error: 'Rate limit: too many Sarvam calls in one minute.' });

  if (!key) return send(res, 503, { error: 'No Sarvam key saved. Add one in Settings → AI connection.' });

  try {
    if (route === '/stt') {
      const ct = String(req.headers['content-type'] || '');
      if (!ct.startsWith('multipart/form-data')) return send(res, 400, { error: 'multipart/form-data required' });
      const raw = await readBody(req, 12 * 1024 * 1024);
      return forward(
        res,
        `${SARVAM}/speech-to-text`,
        { method: 'POST', headers: { 'api-subscription-key': key, 'Content-Type': ct }, body: raw },
        'stt',
      );
    }
    const raw = await readBody(req, 1024 * 1024);
    let body;
    try {
      body = JSON.parse(raw.toString('utf8') || '{}');
    } catch {
      return send(res, 400, { error: 'Invalid JSON' });
    }
    const mapped = mapJson(route, body ?? {});
    if (mapped === undefined) return send(res, 404, { error: 'Unknown route' });
    if (mapped === null) return send(res, 400, { error: 'Missing required fields' });
    const [path, upBody] = mapped;
    return forward(
      res,
      `${SARVAM}${path}`,
      {
        method: 'POST',
        headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(upBody),
      },
      route.slice(1),
    );
  } catch (err) {
    return send(res, err?.status || 500, { error: err?.message || 'Request failed' });
  }
}
