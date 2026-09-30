/**
 * Render smoke test. No jsdom, no test runner: it renders the whole tree with
 * react-dom/server and asserts that the key landmarks and every teammate name
 * made it into the output. Catches a crash-on-mount or a broken component long
 * before a browser is involved.
 *
 * Run: npm run smoke
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { SettingsProvider } from '../src/context/SettingsContext';
import { AnnouncerProvider } from '../src/context/AnnouncerContext';
import { WORKING_AGENTS } from '../src/agents/registry';
import { SUB_AGENTS } from '../src/agents/subAgents';
import { routeWithRules } from '../src/agents/router';
import { runAgent, runPlanner } from '../src/agents/run';
import { PLACES } from '../src/lib/data';
import { PERSONAS } from '../src/dashboard/personas';
import { t } from '../src/i18n/strings';
import { routeForced } from '../src/agents/router';
import type { Settings } from '../src/types';

// ---- minimal browser shims. Installed before render, which is when the tree
// ---- actually touches localStorage / navigator / document.
const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;

g.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};
g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
g.window = g;
// Motion's layout projection attaches a resize listener to window.
g.addEventListener = () => {};
g.removeEventListener = () => {};
g.speechSynthesis = { cancel() {}, speak() {}, getVoices: () => [] };
if (!g.navigator) g.navigator = {};
try {
  Object.defineProperty(g.navigator, 'onLine', { value: true, configurable: true });
} catch {
  /* Node already defines a read-only navigator.onLine — fine either way */
}
g.document = {
  documentElement: { dataset: {}, style: { setProperty() {} }, lang: 'en' },
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
  activeElement: null,
};
g.fetch = async () => {
  throw new Error('offline in smoke test');
};

const html = renderToStaticMarkup(
  createElement(SettingsProvider, null, createElement(AnnouncerProvider, null, createElement(App))),
);

// Second render with developer mode persisted, as a returning developer sees it.
store.set('sahayak.settings.v1', JSON.stringify({ devMode: true }));
const devHtml = renderToStaticMarkup(
  createElement(SettingsProvider, null, createElement(AnnouncerProvider, null, createElement(App))),
);
store.clear();

const checks: Array<[string, boolean]> = [
  ['emergency bar renders 112', html.includes('tel:112')],
  ['emergency bar renders 1098', html.includes('tel:1098')],
  ['app title present', html.includes('सहायक') || html.includes('Sahayak')],
  ['skip link present', html.includes('#main')],
  ['composer textarea present', html.includes('id="ask"')],
  ['main landmark present', html.includes('id="main"')],
  ['teammate rail present', html.includes('id="teammates"')],
  ['quick-help empty state present', html.includes('quick-heading')],
  ['live region present', html.includes('aria-live="polite"')],
  ...WORKING_AGENTS.map(
    (a) => [`teammate listed: ${a.name}`, html.includes(a.name)] as [string, boolean],
  ),
  ['sub-agent picker hidden for normal users', !html.includes('calculator|calculator.wages')],
  ['dev mode: sub-agent picker renders', devHtml.includes('calculator|calculator.wages')],
  ['dev mode: every sub-agent is pickable', Object.keys(SUB_AGENTS).every((id) => devHtml.includes(`|${id}"`))],
  ['dev mode: header badge', devHtml.includes('>dev<')],
  ['dashboard title renders', html.includes('id="dash-title"')],
  ['persona picker: 8 radios', (html.match(/name="persona"/g) ?? []).length === PERSONAS.length],
  ['default persona schemes render (NFSA card)', html.includes('id="card-nfsa"')],
  ['scheme cards have an Ask button', html.includes(t('hi-IN', 'askAssistant'))],
  ['official scheme links open safely', html.includes('rel="noopener noreferrer"')],
  ['assistant pane present', html.includes('id="assistant"')],
  ['profile form present', html.includes(t('hi-IN', 'myProfile'))],
  ['tracker present', html.includes('id="tracker-heading"')],
  ['view switch present', html.includes(t('hi-IN', 'navAssistant'))],
  // Double-encoded UTF-8 (e.g. "à¤" for Devanagari, "ðŸ" for emoji) means a
  // source file was re-saved in the wrong encoding.
  ['no mojibake in rendered text', !/à¤|à¥|ðŸ|â€/.test(html)],
];

// Farmer persona in English: its schemes, calendar and quick services render.
store.set('sahayak.settings.v1', JSON.stringify({ persona: 'farmer', lang: 'en-IN' }));
const farmerHtml = renderToStaticMarkup(
  createElement(SettingsProvider, null, createElement(AnnouncerProvider, null, createElement(App))),
);
store.clear();
checks.push(
  ['farmer: PM-KISAN card', farmerHtml.includes('id="card-pm-kisan"')],
  ['farmer: crop insurance card', farmerHtml.includes('id="card-pmfby"')],
  ['farmer: season calendar', farmerHtml.includes('id="cal-heading"')],
  ['farmer: quick service', farmerHtml.includes('Report crop loss')],
  ['farmer: Kisan Mitra in the team', farmerHtml.includes('Kisan Mitra')],
  ['farmer: helpline 155261', farmerHtml.includes('tel:155261')],
);


// ---- end-to-end offline turns through the real agent runners ----
const settings = {
  lang: 'en-IN', theme: 'light', contrast: 'normal', font: 'default', motion: 'full', scale: 1,
  autoSpeak: false, showTrace: true, simpleLanguage: false, place: PLACES[0], devMode: true,
  routerEngine: 'rules',
} as Settings;

async function e2e() {
  const scamQ = 'SMS says account will be blocked tonight, share OTP at bit.ly/kyc';
  const scamR = routeWithRules(scamQ, 'en-IN');
  const scam = await runAgent({ id: scamR.primary, question: scamQ, routing: scamR, settings });
  checks.push(['e2e scam: verdict on top', scam.body.startsWith('**🔴 High risk')]);
  checks.push(['e2e scam: tool run recorded', scam.tools?.[0]?.name === 'scam.patterns']);

  const calcQ = 'I worked 24 days at 245 rupees a day under MGNREGA, how much is due?';
  const calcR = routeWithRules(calcQ, 'en-IN');
  const calc = await runAgent({ id: calcR.primary, question: calcQ, routing: calcR, settings });
  checks.push(['e2e calculator: ₹5,880 in answer', calc.body.includes('₹5,880')]);

  const planQ = 'Flood took our house, we lost the ration card, and my husband has not been paid for 20 days';
  const planR = routeWithRules(planQ, 'en-IN');
  const parts: string[] = [];
  const plan = await runPlanner({ routing: planR, settings, onPart: (a, st) => st === 'start' && parts.push(a) });
  checks.push([`e2e planner: fanned out to ${parts.join(',')}`, parts.length === 3]);
  checks.push(['e2e planner: shelter step before wages', plan.body.indexOf('Ashray') < plan.body.indexOf('Kaam')]);
  checks.push(['e2e planner: merge recorded', plan.tools?.some((t) => t.name === 'merge') ?? false]);

  const subQ = 'I moved to another state for work, can I get ration here?';
  const subR = routeWithRules(subQ, 'en-IN');
  const sub = await runAgent({ id: subR.primary, question: subQ, routing: subR, settings });
  checks.push(['e2e sub-agent tip reaches the answer', sub.body.includes('14445') && sub.subAgent === 'ration.portability']);

  // A scheme card question: dashboard route → Kisan Mitra › PM-KISAN money,
  // with that sub-agent's tip and the PM-KISAN helpline in the answer.
  const cardQ = 'PM-KISAN: am I eligible, which documents do I need, and how do I apply?';
  const cardR = routeForced(cardQ, 'en-IN', { agent: 'farmer', sub: 'farmer.income', origin: 'dashboard', label: 'PM-KISAN' });
  const card = await runAgent({ id: cardR.primary, question: cardQ, routing: cardR, settings: { ...settings, persona: 'farmer', profile: { landHectares: 1 } } });
  checks.push(['e2e dashboard card → Kisan Mitra', cardR.primary === 'farmer' && card.subAgent === 'farmer.income']);
  checks.push(['e2e dashboard card: sub-agent tip', card.body.includes('Beneficiary Status')]);
  checks.push(['e2e dashboard card: PM-KISAN helpline attached', card.helplines?.some((h) => h.phone === '155261') ?? false]);
}

void e2e()
  .catch((err) => checks.push([`e2e crashed: ${String(err)}`, false]))
  .then(() => {
    let failed = 0;
    for (const [label, ok] of checks) {
      if (!ok) failed += 1;
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
    }
    console.log(
      `\n${checks.length - failed}/${checks.length} checks passed (${html.length} bytes rendered)`,
    );
    process.exit(failed === 0 ? 0 : 1);
  });
