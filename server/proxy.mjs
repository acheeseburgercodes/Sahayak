/**
 * Sahayak's Sarvam AI proxy.
 *
 * Why this exists: the Sarvam subscription key must never reach the browser.
 * A key in a VITE_* variable is compiled into the JS bundle and is readable by
 * anyone who opens devtools. This process holds the key and the browser only
 * ever talks to 127.0.0.1.
 *
 * Bound to loopback only. There is NO authentication on these routes, so do
 * not expose this port publicly — for a real deployment put it behind your own
 * session auth and rate limiting first.
 */
import express from 'express';
import 'dotenv/config';

const PORT = Number(process.env.SAHAYAK_PROXY_PORT || 8787);
const HOST = '127.0.0.1';
const KEY = process.env.SARVAM_API_KEY || '';
const SARVAM = 'https://api.sarvam.ai';
const CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-m';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Crude per-IP token bucket: it is loopback-only, but a runaway render loop in
// the UI should not burn the user's whole Sarvam quota.
const buckets = new Map();
const LIMIT = 60;
const WINDOW_MS = 60_000;

app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const now = Date.now();
  const b = buckets.get(req.ip) ?? { count: 0, reset: now + WINDOW_MS };
  if (now > b.reset) {
    b.count = 0;
    b.reset = now + WINDOW_MS;
  }
  b.count += 1;
  buckets.set(req.ip, b);
  if (b.count > LIMIT) {
    return res.status(429).json({ error: 'Rate limit: too many Sarvam calls in one minute.' });
  }
  return next();
});

function headers(extra = {}) {
  return { 'api-subscription-key': KEY, ...extra };
}

async function forward(res, url, init, label) {
  try {
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error(`[sarvam:${label}] ${upstream.status} ${text.slice(0, 300)}`);
      return res.status(upstream.status).type('application/json').send(
        text || JSON.stringify({ error: `${label} failed` }),
      );
    }
    return res.status(200).type('application/json').send(text);
  } catch (err) {
    console.error(`[sarvam:${label}] network error`, err?.message);
    return res.status(502).json({ error: `Could not reach Sarvam (${label}).` });
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(KEY), model: CHAT_MODEL });
});

app.post('/chat', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'SARVAM_API_KEY not set' });
  const { messages, temperature = 0.3, max_tokens = 900 } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] required' });
  }
  return forward(
    res,
    `${SARVAM}/v1/chat/completions`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model: CHAT_MODEL, messages, temperature, max_tokens }),
    },
    'chat',
  );
});

app.post('/translate', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'SARVAM_API_KEY not set' });
  const {
    input,
    source_language_code = 'auto',
    target_language_code,
    mode = 'colloquial',
    speaker_gender = 'Female',
    enable_preprocessing = true,
  } = req.body ?? {};
  if (!input || !target_language_code) {
    return res.status(400).json({ error: 'input and target_language_code required' });
  }
  return forward(
    res,
    `${SARVAM}/translate`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        input,
        source_language_code,
        target_language_code,
        mode,
        speaker_gender,
        enable_preprocessing,
        model: process.env.SARVAM_TRANSLATE_MODEL || 'mayura:v1',
      }),
    },
    'translate',
  );
});

app.post('/tts', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'SARVAM_API_KEY not set' });
  const { text, target_language_code, speaker = 'anushka', pace = 1, loudness = 1 } = req.body ?? {};
  if (!text || !target_language_code) {
    return res.status(400).json({ error: 'text and target_language_code required' });
  }
  return forward(
    res,
    `${SARVAM}/text-to-speech`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        inputs: [String(text).slice(0, 1500)],
        target_language_code,
        speaker,
        pace,
        loudness,
        speech_sample_rate: 22050,
        model: process.env.SARVAM_TTS_MODEL || 'bulbul:v2',
      }),
    },
    'tts',
  );
});

// Multipart passthrough for speech-to-text: we stream the raw body and its
// content-type straight through rather than re-parsing the upload.
app.post('/stt', express.raw({ type: 'multipart/form-data', limit: '12mb' }), async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'SARVAM_API_KEY not set' });
  return forward(
    res,
    `${SARVAM}/speech-to-text`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': req.headers['content-type'] }),
      body: req.body,
    },
    'stt',
  );
});

app.listen(PORT, HOST, () => {
  const state = KEY ? 'key loaded' : 'NO KEY — app will run in demo mode';
  console.log(`[sahayak] Sarvam proxy on http://${HOST}:${PORT}  (${state})`);
});
