# Sahayak AI

A multi-agent web assistant for the everyday emergencies of low-income
households in India — **finding ration, finding shelter, reaching emergency
services**, getting treated without selling land, recovering unpaid wages,
getting documents made, escaping a moneylender, and turning a refusal at a
government counter into a complaint that has to be answered.

The model is the one Grok's multi-agent mode popularised: **a router reads the
problem and hands it to the right specialist, who answers, and a teammate
chimes in with the thing the specialist would have missed.** Here the
specialists are not coding assistants — they are the eight services a person in
trouble actually needs, and they speak eleven Indian languages via Sarvam AI.

## The team

| Agent | Name | Covers |
| --- | --- | --- |
| 🚨 `emergency` | Raksha | Accident, fire, violence, missing child, ambulance. Answers first, always, in under 150 words with the number on the first line. |
| 🌾 `ration` | Ration Didi | Ration card, fair-price shops, free grain entitlement, e-KYC, portability, a dealer who refuses or short-weighs. |
| ⛺ `shelter` | Ashray | Floods, earthquakes, relief camps, night shelters, evacuation routes, post-disaster relief and compensation. |
| 🩺 `health` | Arogya | Free public treatment, Ayushman Bharat card, Jan Aushadhi generics, pregnancy, danger signs. |
| 🛠️ `livelihood` | Kaam Bhai | MGNREGA work, unpaid wages, the written-demand paper trail, migrant worker rights, e-Shram. |
| 📄 `documents` | Kagaz Mitra | Aadhaar with no proof, certificates, pensions, the fee board, middlemen. |
| 💰 `money` | Paisa Mitra | Moneylender debt and threats, Jan Dhan / SHG / Mudra alternatives, DBT failures, fraud within the 3-day window. |
| ⚖️ `grievance` | Nyaya | Drafts the complaint, names where to submit it and how to get proof, RTI, free legal aid. |

Every agent's system prompt encodes the same non-negotiables: answer in the
user's language, lead with the next *physical* action, say when something is
**free**, warn about middlemen, never invent a phone number or address, never
ask for an Aadhaar number or an OTP, and send life-threatening cases to 112
before anything else.

## Routing

Two engines, and the deterministic one is never skipped:

1. **Rules engine** (`src/agents/router.ts`) — weighted keyword scoring over a
   merged trigger set per agent, covering English, romanised Hindi, Devanagari
   and nine other Indic scripts (`src/agents/multilingualTriggers.ts`). Runs on
   every message, offline, in microseconds. It also does script-based language
   detection, including the Hindi/Marathi split.
2. **Sarvam LLM router** — asked for strict JSON when a key is configured, and
   it refines the rules decision. It **cannot downgrade urgency**: if the rules
   engine sees a life-risk phrase, `emergency` stays primary regardless of what
   the model says, and any failure or malformed JSON falls back to the rules
   decision silently.

The decision is inspectable in the UI — chosen agent, collaborators, urgency,
confidence bar, per-agent scores and which engine decided. A user can also
**pin** an agent from the rail and skip routing entirely.

Resource cards (addresses, hours, phone numbers) are **never** taken from model
output. They are rendered from `src/lib/data.ts`, so a hallucinated shelter
address cannot reach the screen.

## Accessibility

Built for users who may not read well, may not read at all, and may be doing
this one-handed on a cracked phone in the rain.

- **Voice in and voice out.** Web Speech API where available, otherwise
  MediaRecorder → Sarvam Saarika for input; Sarvam Bulbul for output with the
  browser's `speechSynthesis` as fallback. Optional read-every-answer-aloud.
- **Eleven languages**, each listed in its own script, with the UI shell
  hand-translated for Hindi and English so it needs no network call.
- **High contrast mode** (pure black/white, forced borders), **dark mode**, a
  **dyslexia-friendly font** with looser tracking, and **text scaling to 160%**
  driven by a single CSS custom property.
- **Reduced motion** honoured from the OS and overridable in Settings.
- Two **skip links**, a visible 3px focus ring that is never clipped, a full
  **focus trap** with focus restoration in the Settings dialog, and keyboard
  shortcuts (`/` to compose, `Alt+M` to the team list, `Esc` to close or stop
  speech).
- One **polite/assertive live-region pair** announces routing, which agent is
  answering, and errors — emergencies announce assertively.
- **44×44 minimum hit targets** throughout, `tel:` links everywhere a number
  appears, and an always-visible emergency bar with 112 / 108 / 1098 / 181 that
  needs no reading, no language choice and no typing.
- Markdown is rendered by a hand-written component (`src/components/Markdown.tsx`) —
  no `dangerouslySetInnerHTML` anywhere, so model output cannot inject markup.

## Running it

```bash
npm install
cp .env.example .env     # then paste your Sarvam key into SARVAM_API_KEY
npm run dev              # web on 127.0.0.1:5174, proxy on 127.0.0.1:8787
```

It runs **without a key**: the app detects an unconfigured proxy, shows a demo
banner, and serves hand-written offline answers (English and Hindi) with real
national helpline numbers. Routing, language detection, voice via Web Speech,
and every accessibility feature work identically.

### Verify

```bash
npm run verify     # typecheck + 23 routing cases + 17 render checks + prod build
```

- `npm run check:routing` — asserts each realistic problem statement, in all
  eleven languages, reaches the right teammate using **only** the offline rules
  engine, with the expected urgency and language, and with at least one
  collaborator attached.
- `npm run smoke` — renders the whole tree through `react-dom/server` with
  minimal browser shims and asserts the landmarks, the emergency numbers, the
  live region and all eight teammates are present.

## Security notes

- **The Sarvam key never reaches the browser.** It lives only in
  `server/proxy.mjs`, a Node process. Do not move it to a `VITE_*` variable —
  those are compiled into the public bundle. The client calls `/sarvam/*` and
  the proxy injects `api-subscription-key`.
- The proxy binds to `127.0.0.1` only and has a crude per-IP token bucket
  (60 calls/minute) so a render loop cannot burn the quota.
- **The proxy has no authentication.** It is a local development component. If
  you deploy this, put your own session auth, rate limiting and abuse
  monitoring in front of it before it is reachable from anywhere but loopback.

## Data caveat — read before showing this to anyone

`src/lib/data.ts` holds two very different kinds of row:

- The **helpline numbers are real** national numbers (112, 108, 1098, 181, 1967,
  15100, 1930, 14416, …).
- The **local rows — ration shops, shelters, hospitals, offices — are
  illustrative fixtures.** They must be replaced with live feeds (state PDS
  portal, NDMA/SDMA shelter lists, the PM-JAY hospital registry, the CSC
  locator) before a real user relies on them. A wrong shelter address during a
  flood is worse than no address at all.

Sahayak gives guidance, not official decisions, and it is not a substitute for
emergency services.
