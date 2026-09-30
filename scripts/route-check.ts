/**
 * Router regression check. Asserts that realistic problem statements, in every
 * supported language, reach the right teammate using ONLY the offline rules
 * engine (no API key). If a trigger table regresses, this fails loudly.
 *
 * Run: npm run check:routing
 */
import { routeForced, routeWithRules, detectUrgency } from '../src/agents/router';
import { calcInterest, calcRation, calcWages, checkScam } from '../src/agents/tools';
import { SUB_AGENTS } from '../src/agents/subAgents';
import { SCHEMES, SCHEME_BY_ID } from '../src/dashboard/schemes';
import { PERSONAS } from '../src/dashboard/personas';
import type { AgentId, PersonaId, Profile, Urgency } from '../src/types';

interface Case {
  text: string;
  expect: AgentId;
  lang?: string;
  urgency?: Urgency;
  sub?: string;
}

const CASES: Case[] = [
  // Hindi / Devanagari
  { text: 'राशन की दुकान वाला हर बार लौटा देता है, कार्ड ब्लॉक बता रहा है', expect: 'ration', lang: 'hi-IN' },
  { text: 'पड़ोसी छत से गिर गए और होश में नहीं आ रहे', expect: 'emergency', lang: 'hi-IN', urgency: 'emergency' },
  { text: 'हमारी गली में पानी आ रहा है, सबसे नजदीक शरण कहाँ है', expect: 'shelter', lang: 'hi-IN' },
  { text: 'माँ 70 साल की हैं, पेंशन नहीं मिलती, सिर्फ आधार है', expect: 'documents', lang: 'hi-IN' },
  { text: 'दफ़्तर मुफ़्त काम के लिए रिश्वत माँग रहा है', expect: 'grievance', lang: 'hi-IN' },

  // English
  { text: 'Water is rising in our lane, we are four people and one is old', expect: 'shelter', lang: 'en-IN' },
  { text: 'Contractor has not paid 18 days of wages and blocks my calls', expect: 'livelihood', lang: 'en-IN' },
  { text: 'My child has fever and the private doctor wants 3000 rupees', expect: 'health', lang: 'en-IN' },
  { text: 'Someone called saying bank officer and 8000 rupees left my account', expect: 'money', lang: 'en-IN' },

  // Romanised Hindi
  { text: 'bachche ko 4 din se bukhar hai, private doctor 3000 maang raha', expect: 'health', lang: 'hi-IN' },

  // Regional scripts — these must not fall through to the generalist.
  { text: 'நான் ரேஷன் கார்டு இழந்துவிட்டேன்', expect: 'ration', lang: 'ta-IN' },
  { text: 'ஆம்புலன்ஸ் வேண்டும், விபத்து நடந்தது', expect: 'emergency', lang: 'ta-IN' },
  { text: 'বন্যার জল ঘরে ঢুকছে, আশ্রয় কোথায়', expect: 'shelter', lang: 'bn-IN' },
  { text: 'నాకు పెన్షన్ రావడం లేదు, ఆధార్ మాత్రమే ఉంది', expect: 'documents', lang: 'te-IN' },
  { text: 'ठेकेदाराने मजुरी दिली नाही', expect: 'livelihood', lang: 'mr-IN' },
  { text: 'ആശുപത്രിയിൽ പണം ചോദിക്കുന്നു, മരുന്ന് വേണം', expect: 'health', lang: 'ml-IN' },
  { text: 'ਸ਼ਾਹੂਕਾਰ ਨੇ ਕਰਜ਼ਾ ਦਿੱਤਾ, ਵਿਆਜ ਬਹੁਤ ਹੈ', expect: 'money', lang: 'pa-IN' },
  { text: 'ನನಗೆ ರೇಷನ್ ಸಿಗುತ್ತಿಲ್ಲ', expect: 'ration', lang: 'kn-IN' },
  { text: 'ମୋ ଅଭିଯୋଗ କେହି ଶୁଣୁନାହାନ୍ତି, ଲାଞ୍ଚ ମାଗୁଛନ୍ତି', expect: 'grievance', lang: 'or-IN' },
  { text: 'પૂરના કારણે આશ્રય જોઈએ છે', expect: 'shelter', lang: 'gu-IN' },

  // Advanced bots
  { text: 'SMS says my electricity will be cut tonight, click this link to update', expect: 'scam', lang: 'en-IN' },
  { text: 'मैसेज आया है कि आज रात बिजली कटेगी, लिंक पर क्लिक करके अपडेट करो', expect: 'scam', lang: 'hi-IN' },
  { text: 'A message says I won KBC lottery and must pay 5000 registration fee', expect: 'scam', lang: 'en-IN' },
  { text: 'We are 6 people on a PHH card, how much free grain should we get?', expect: 'calculator', lang: 'en-IN', sub: 'calculator.ration' },
  { text: 'हम PHH कार्ड पर 6 लोग हैं, कितना मुफ़्त अनाज मिलना चाहिए?', expect: 'calculator', lang: 'hi-IN', sub: 'calculator.ration' },
  { text: 'I worked 24 days at 245 rupees a day under MGNREGA, how much is due?', expect: 'calculator', sub: 'calculator.wages' },
  { text: 'Sahukar gave 10000 at 5 rupees saikda, how much interest in a year?', expect: 'calculator', sub: 'calculator.interest' },
  { text: 'Flood took our house, we lost the ration card, and my husband has not been paid for 20 days', expect: 'planner', lang: 'en-IN' },
  { text: 'बाढ़ में घर गया, राशन कार्ड खो गया, और पति को 20 दिन से मज़दूरी नहीं मिली', expect: 'planner', lang: 'hi-IN' },

  // Sub-agent selection inside a teammate
  { text: 'I moved to another state for work, can I get ration here?', expect: 'ration', sub: 'ration.portability' },
  { text: 'The dealer gave short weight and says no stock', expect: 'ration', sub: 'ration.dealer' },
  { text: 'Police refuse to write my FIR, what do I do', expect: 'grievance', sub: 'grievance.police' },
  { text: 'My wife is pregnant, is delivery free in the government hospital?', expect: 'health', sub: 'health.maternal' },

  // Sector teammates (dashboard)
  { text: 'My PM-KISAN instalment stopped coming after the last one', expect: 'farmer', lang: 'en-IN', sub: 'farmer.income' },
  { text: 'Hailstorm destroyed my wheat yesterday, how do I claim crop insurance?', expect: 'farmer', sub: 'farmer.insurance' },
  { text: 'How can I get a Kisan Credit Card with 2 acres?', expect: 'farmer', sub: 'farmer.credit' },
  { text: 'किसान सम्मान निधि की किस्त नहीं आई', expect: 'farmer', lang: 'hi-IN', sub: 'farmer.income' },
  { text: 'ओले से फसल बर्बाद हो गई, बीमा कैसे मिलेगा', expect: 'farmer', lang: 'hi-IN', sub: 'farmer.insurance' },
  { text: 'mandi bhav kahan dekhe, gehu MSP par bechna hai', expect: 'farmer', sub: 'farmer.market' },
  { text: 'எனது பயிர் மழையால் அழிந்தது, விவசாயி உதவி', expect: 'farmer', lang: 'ta-IN' },
  { text: 'শস্য বীমা চাই, আমি কৃষক', expect: 'farmer', lang: 'bn-IN' },
  { text: 'ਕਿਸਾਨ ਨੂੰ ਖਾਦ ਨਹੀਂ ਮਿਲ ਰਹੀ', expect: 'farmer', lang: 'pa-IN' },
  { text: 'My daughter passed class 10, which scholarship can she get?', expect: 'education', sub: 'education.scholarship' },
  { text: 'How do I get a free RTE seat for my son in a private school?', expect: 'education', sub: 'education.school' },
  { text: 'बेटी को छात्रवृत्ति कैसे मिलेगी', expect: 'education', lang: 'hi-IN' },
  { text: 'నాకు స్కాలర్‌షిప్ కావాలి, నేను విద్యార్థి', expect: 'education', lang: 'te-IN' },
  { text: 'I sell vegetables on a cart, can I get a loan without guarantee?', expect: 'enterprise', sub: 'enterprise.vendor' },
  { text: 'I am a carpenter, what is PM Vishwakarma and how do I join?', expect: 'enterprise', sub: 'enterprise.artisan' },
  { text: 'मैं ठेला लगाता हूँ, स्वनिधि लोन कैसे मिलेगा', expect: 'enterprise', lang: 'hi-IN', sub: 'enterprise.vendor' },
  { text: 'I want a Mudra loan to start a tailoring business', expect: 'enterprise', sub: 'enterprise.loan' },
];

let failed = 0;

for (const c of CASES) {
  const r = routeWithRules(c.text, 'hi-IN');
  const okAgent = r.primary === c.expect;
  const okLang = !c.lang || r.detectedLanguage === c.lang;
  const okUrgency = !c.urgency || r.urgency === c.urgency;
  const okSub = !c.sub || r.subAgent === c.sub;
  const ok = okAgent && okLang && okUrgency && okSub;
  if (!ok) failed += 1;

  const problems = [
    okAgent ? '' : `agent=${r.primary} want ${c.expect}`,
    okLang ? '' : `lang=${r.detectedLanguage} want ${c.lang}`,
    okUrgency ? '' : `urgency=${r.urgency} want ${c.urgency}`,
    okSub ? '' : `sub=${r.subAgent} want ${c.sub}`,
  ]
    .filter(Boolean)
    .join(', ');

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${r.primary.padEnd(11)} ${(r.detectedLanguage ?? '?').padEnd(6)} ` +
      `${(r.subAgent ?? '-').padEnd(22)} conf ${r.confidence.toFixed(2)}  +[${r.collaborators.join(',')}]`.padEnd(30) +
      `${r.plan ? ` plan[${r.plan.map((p) => p.agent).join(',')}]` : ''}` +
      `| ${c.text.slice(0, 38)}${problems ? `   << ${problems}` : ''}`,
  );

  // Every answer must arrive with at least one teammate alongside it — for the
  // planner, its fan-out plan is the team.
  if (r.collaborators.length === 0 && !(r.plan && r.plan.length >= 2)) {
    failed += 1;
    console.log('      FAIL  no collaborator attached');
  }
}

// ---- deterministic tools ----
const toolChecks: Array<[string, boolean]> = [];
{
  const v = checkScam('Dear customer your KYC expired, account will be blocked tonight. Update at bit.ly/xyz or call 9876543210', 'en-IN');
  toolChecks.push([`scam high risk (${v.risk}, ${v.flags.map((f) => f.id).join('+')})`, v.risk === 'high']);
  const safe = checkScam('Your ration for October has been distributed at FPS 2041', 'en-IN');
  toolChecks.push([`benign SMS low risk (${safe.risk})`, safe.risk === 'low']);
  const otp = checkScam('Share the OTP you received to get your refund', 'en-IN');
  toolChecks.push(['OTP request is high risk', otp.risk === 'high']);
  const shop = checkScam('Pink ration card shopping list', 'en-IN');
  toolChecks.push(['"pink"/"shopping" do not trip the PIN rule', !shop.flags.some((f) => f.id === 'asks-otp')]);

  const r6 = calcRation('We are 6 people on a PHH card', 'en-IN');
  toolChecks.push([`ration 6 PHH = 30 kg`, r6.ok && r6.summary.includes('30 kg')]);
  const rHi = calcRation('हम ६ लोग हैं', 'hi-IN');
  toolChecks.push([`ration Devanagari digits = 30 किलो`, rHi.ok && rHi.summary.includes('30 किलो')]);
  const aay = calcRation('We have an Antyodaya card, 3 people', 'en-IN');
  toolChecks.push(['AAY = 35 kg family', aay.summary.includes('35 kg')]);
  const aaya = calcRation('message aaya hai, 4 log', 'en-IN');
  toolChecks.push(['"aaya" is not AAY', !aaya.summary.includes('35 kg')]);

  const w = calcWages('I worked 24 days at 245 rupees a day under MGNREGA', 'en-IN');
  toolChecks.push([`wages 24×245 = ₹5,880`, w.ok && w.summary.includes('₹5,880') && w.summary.includes('76 more days')]);
  const w2 = calcWages('24 days, 245 a day', 'en-IN');
  toolChecks.push([`wages "24 days, 245 a day" not swapped`, w2.ok && w2.summary.includes('₹5,880')]);
  const wMissing = calcWages('Contractor has not paid 18 days of wages', 'en-IN');
  toolChecks.push(['wages without a rate asks for it', !wMissing.ok]);

  const i = calcInterest('Sahukar gave 10000 at 5 rupees saikda', 'en-IN');
  toolChecks.push([`5 saikda = 60%/yr, ₹6,000 on ₹10,000`, i.ok && i.summary.includes('60%') && i.summary.includes('₹6,000')]);
  const i2 = calcInterest('Borrowed 1.5 lakh at 3% per month', 'en-IN');
  toolChecks.push([`3%/month on 1.5 lakh = 36%, ₹54,000`, i2.ok && i2.summary.includes('36%') && i2.summary.includes('₹54,000')]);
}
for (const [label, ok] of toolChecks) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  tool ${label}`);
}

// ---- developer forced routes ----
{
  const f = routeForced('anything at all', 'hi-IN', { agent: 'ration', sub: 'ration.new-card' });
  const ok = f.primary === 'ration' && f.subAgent === 'ration.new-card' && f.subEngine === 'forced';
  if (!ok) failed += 1;
  toolChecks.push(['forced', ok]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  forced route ration › new-card`);
  const bad = routeForced('anything', 'hi-IN', { agent: 'ration', sub: 'health.maternal' });
  const ok2 = bad.subAgent !== 'health.maternal';
  if (!ok2) failed += 1;
  toolChecks.push(['forced-mismatch', ok2]);
  console.log(`${ok2 ? 'PASS' : 'FAIL'}  forced sub from another teammate is ignored`);

  // Dashboard-origin routes: the card's owner leads, a teammate still joins,
  // and a life-risk message is never trapped behind a scheme card.
  const d = routeForced('am I eligible and how do I apply?', 'en-IN', {
    agent: 'farmer', sub: 'farmer.income', origin: 'dashboard', label: 'PM-KISAN',
  });
  const ok3 = d.primary === 'farmer' && d.subAgent === 'farmer.income' && d.engine === 'dashboard' && d.collaborators.length === 1;
  if (!ok3) failed += 1;
  toolChecks.push(['dashboard', ok3]);
  console.log(`${ok3 ? 'PASS' : 'FAIL'}  dashboard card route → farmer › income +[${d.collaborators.join(',')}]`);
  const d2 = routeForced('my father fell from the roof and is not breathing', 'en-IN', {
    agent: 'farmer', origin: 'dashboard', label: 'PM-KISAN',
  });
  const ok4 = d2.primary === 'emergency' && d2.urgency === 'emergency';
  if (!ok4) failed += 1;
  toolChecks.push(['dashboard-emergency', ok4]);
  console.log(`${ok4 ? 'PASS' : 'FAIL'}  life risk overrides a dashboard card route (${d2.primary})`);

  // Persona fallback: an unmatched question goes to the persona's lead.
  const pf = routeWithRules('how do I apply for it?', 'en-IN', 'farmer');
  const ok5 = pf.primary === 'farmer';
  if (!ok5) failed += 1;
  toolChecks.push(['persona-fallback', ok5]);
  console.log(`${ok5 ? 'PASS' : 'FAIL'}  unmatched question with farmer persona → ${pf.primary}`);
}

// ---- eligibility rules ----
{
  const e = (label: string, ok: boolean) => {
    if (!ok) failed += 1;
    toolChecks.push([label, ok]);
    console.log(`${ok ? 'PASS' : 'FAIL'}  eligibility ${label}`);
  };
  const v = (id: string, p: Profile, persona: PersonaId = 'family') => SCHEME_BY_ID[id].check(p, persona).status;
  e('PM-KISAN: landholder likely', v('pm-kisan', { landHectares: 1 }) === 'likely');
  e('PM-KISAN: tax payer excluded', v('pm-kisan', { landHectares: 1, incomeTaxPayer: true }) === 'no');
  e('PM-KISAN: unknown land → check', v('pm-kisan', {}) === 'check');
  e('PM-JAY: 72-year-old likely regardless of income', v('pm-jay', { age: 72, income: 90000 }) === 'likely');
  e('Old-age pension: 45 → no', v('old-age-pension', { age: 45 }) === 'no');
  e('Ujjwala: already has LPG → no', v('ujjwala', { gender: 'female', hasLpg: true }) === 'no');
  e('MGNREGA: urban → no', v('mgnrega', { area: 'urban', age: 30 }) === 'no');
  e('Disability pension: 60% → check (state)', v('disability-pension', { disabilityPct: 60, age: 30 }) === 'check');
  e('KCC never better than check', v('kcc', { landHectares: 2 }) === 'check');
  e('SVANidhi: urban vendor likely', v('svanidhi', { area: 'urban' }, 'vendor') === 'likely');
  e('every scheme sub-agent exists', SCHEMES.every((s) => !s.sub || SUB_AGENTS[s.sub]?.parent === s.agent));
  e('every persona service sub-agent exists', PERSONAS.every((p) => p.services.every((svc) => !svc.sub || SUB_AGENTS[svc.sub]?.parent === svc.agent)));
}

const urgencyChecks: Array<[string, Urgency]> = [
  ['आग लग गई है', 'emergency'],
  ['last date is tomorrow', 'time-sensitive'],
  ['ration card kaise banwaye', 'routine'],
];
for (const [text, want] of urgencyChecks) {
  const got = detectUrgency(text);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  urgency ${got.padEnd(15)} | ${text}`);
}

const total = CASES.length + urgencyChecks.length + toolChecks.length;
console.log(`\n${failed === 0 ? 'ALL GREEN' : `${failed} FAILURE(S)`} across ${total} cases`);
process.exit(failed === 0 ? 0 : 1);
