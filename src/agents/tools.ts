import type { LangCode, ToolRun } from '../types';

/**
 * Deterministic tools for the advanced bots. Nothing here calls a model: the
 * verdict and the numbers on screen must be reproducible and auditable, and a
 * language model is allowed to explain them but never to change them.
 */

type Bi = { en: string; hi: string };
const pick = (b: Bi, lang: LangCode) => (lang === 'hi-IN' ? b.hi : b.en);

// ---------------------------------------------------------------------------
// Number extraction — Devanagari digits, ₹, commas, "10k", "1.5 lakh".
// ---------------------------------------------------------------------------

const DEVANAGARI = '०१२३४५६७८९';

export function toAsciiDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(DEVANAGARI.indexOf(d)));
}

interface Num {
  value: number;
  /** Lowercased text right after the number — used to tell days from rupees. */
  after: string;
  before: string;
}

export function numbersIn(text: string): Num[] {
  const src = toAsciiDigits(text.toLowerCase());
  const out: Num[] = [];
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lac|लाख|हज़ार|हजार|thousand)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let value = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const unit = m[2];
    if (unit === 'k' || unit === 'thousand' || unit === 'हज़ार' || unit === 'हजार') value *= 1000;
    if (unit === 'lakh' || unit === 'lac' || unit === 'लाख') value *= 100000;
    out.push({
      value,
      after: src.slice(m.index + m[0].length, m.index + m[0].length + 24),
      before: src.slice(Math.max(0, m.index - 16), m.index),
    });
  }
  return out;
}

const has = (text: string, terms: string[]) => terms.some((t) => text.includes(t));

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// ---------------------------------------------------------------------------
// Scam checker
// ---------------------------------------------------------------------------

interface Rule {
  id: string;
  weight: number;
  test: (lower: string, raw: string) => boolean;
  why: Bi;
}

const SHORTENERS = ['bit.ly', 'tinyurl', 'rb.gy', 'cutt.ly', 'is.gd', 't.ly', 'shorturl', 'goo.gl'];

const SCAM_RULES: Rule[] = [
  {
    id: 'asks-otp',
    weight: 5,
    test: (t) => /\b(?:otp|pin|cvv|password)\b/.test(t) || has(t, ['ओटीपी', 'पिन', 'पासवर्ड']),
    why: {
      en: 'Asks for an OTP, PIN, CVV or password. No bank, office or company ever needs these from you.',
      hi: 'OTP, PIN, CVV या पासवर्ड माँगा गया है। कोई बैंक, दफ़्तर या कंपनी यह कभी नहीं माँगती।',
    },
  },
  {
    id: 'screen-share',
    weight: 5,
    test: (t) => has(t, ['anydesk', 'teamviewer', 'quicksupport', 'screen share', 'screen sharing', 'rustdesk']),
    why: {
      en: 'Asks you to install a screen-sharing app. That lets a stranger see and operate your phone and bank app.',
      hi: 'स्क्रीन-शेयर ऐप डालने को कहा गया है। इससे अजनबी आपका फ़ोन और बैंक ऐप चला सकता है।',
    },
  },
  {
    id: 'digital-arrest',
    weight: 5,
    test: (t) =>
      has(t, ['digital arrest', 'डिजिटल अरेस्ट', 'cbi', 'ed officer', 'customs', 'narcotics', 'parcel', 'drugs in']) ||
      (has(t, ['police', 'पुलिस']) && has(t, ['video call', 'वीडियो कॉल'])),
    why: {
      en: 'Claims police, CBI, customs or "digital arrest". Real officers never arrest anyone on a video call or ask for money to close a case.',
      hi: 'पुलिस, CBI, कस्टम या "डिजिटल अरेस्ट" का दावा। असली अफ़सर वीडियो कॉल पर गिरफ़्तार नहीं करते, न केस बंद करने के पैसे माँगते।',
    },
  },
  {
    id: 'advance-fee',
    weight: 4,
    test: (t) =>
      has(t, ['registration fee', 'processing fee', 'security deposit', 'advance fee', 'रजिस्ट्रेशन फीस', 'प्रोसेसिंग फीस', 'pay first', 'पहले पैसे']) ||
      (has(t, ['lottery', 'लॉटरी', 'kbc', 'prize', 'इनाम', 'won', 'जीत']) && has(t, ['pay', 'fee', 'फीस', 'भेजो', 'jama'])),
    why: {
      en: 'Wants a fee before you receive a prize, job or loan. Real prizes, jobs and loans never ask you to pay first.',
      hi: 'इनाम, नौकरी या लोन से पहले फ़ीस माँगी जा रही है। असली इनाम, नौकरी या लोन में पहले पैसा नहीं देना पड़ता।',
    },
  },
  {
    id: 'prize',
    weight: 3,
    test: (t) => has(t, ['lottery', 'लॉटरी', 'kbc', 'you have won', 'you won', 'congratulations', 'बधाई', 'इनाम', 'lucky draw']),
    why: {
      en: 'Says you won a lottery or prize you never entered.',
      hi: 'कहता है कि आपने ऐसी लॉटरी या इनाम जीता है जिसमें आपने हिस्सा ही नहीं लिया।',
    },
  },
  {
    id: 'kyc-block',
    weight: 3,
    test: (t) =>
      has(t, ['kyc', 'केवाईसी', 'pan update', 'account blocked', 'account will be blocked', 'account suspended', 'खाता बंद', 'खाता ब्लॉक', 'sim block']),
    why: {
      en: 'Threatens to block your account or SIM unless you "update KYC". Banks do KYC at the branch, not through a message.',
      hi: '"KYC अपडेट" न करने पर खाता या सिम बंद करने की धमकी। बैंक KYC शाखा में करता है, मैसेज से नहीं।',
    },
  },
  {
    id: 'electricity',
    weight: 3,
    test: (t) => has(t, ['electricity', 'bijli', 'बिजली', 'power will be', 'light will be cut']) && has(t, ['cut', 'disconnect', 'कट', 'tonight', 'आज रात', 'officer', 'call']),
    why: {
      en: 'Electricity-disconnection threat. Boards send official bills; they do not ask you to call a personal number tonight.',
      hi: 'बिजली काटने की धमकी। बिजली विभाग बिल भेजता है; "आज रात" किसी निजी नंबर पर कॉल करने को नहीं कहता।',
    },
  },
  {
    id: 'urgency',
    weight: 2,
    test: (t) => has(t, ['tonight', 'within 24 hours', 'immediately', 'urgent', 'last warning', 'आज रात', 'तुरंत', 'अभी', '24 घंटे']),
    why: {
      en: 'Rushes you ("tonight", "immediately"). Pressure to act fast is how fraudsters stop you from checking.',
      hi: 'जल्दबाज़ी करवा रहा है ("आज रात", "तुरंत")। जल्दी का दबाव इसलिए ताकि आप जाँच न कर पाएँ।',
    },
  },
  {
    id: 'short-link',
    weight: 3,
    test: (t) => has(t, SHORTENERS),
    why: {
      en: 'Contains a shortened link that hides where it really goes.',
      hi: 'इसमें छोटा किया हुआ लिंक है जो असली पता छिपाता है।',
    },
  },
  {
    id: 'link',
    weight: 2,
    test: (t) => /https?:\/\/|www\.|\.(?:in|com|xyz|top|online|site|info)\b/.test(t) || has(t, ['click', 'link', 'लिंक', 'क्लिक']),
    why: {
      en: 'Asks you to open a link. Do not open it — type the official website yourself if you need to check.',
      hi: 'लिंक खोलने को कहता है। उसे न खोलें — जाँचना हो तो आधिकारिक वेबसाइट ख़ुद टाइप करें।',
    },
  },
  {
    id: 'apk',
    weight: 5,
    test: (t) => has(t, ['.apk', 'apk file', 'install this app', 'download this app', 'यह ऐप डाउनलोड']),
    why: {
      en: 'Asks you to install an app from a link or file. Such apps read your SMS and OTPs.',
      hi: 'लिंक या फ़ाइल से ऐप डालने को कहता है। ऐसे ऐप आपके SMS और OTP पढ़ लेते हैं।',
    },
  },
  {
    id: 'qr-receive',
    weight: 4,
    test: (t) => has(t, ['qr', 'क्यूआर', 'scan']) && has(t, ['receive', 'get money', 'refund', 'पैसे मिलेंगे', 'पाने']),
    why: {
      en: 'Asks you to scan a QR code or enter a UPI PIN to "receive" money. Scanning or entering a PIN only ever sends money.',
      hi: 'पैसा "पाने" के लिए QR स्कैन या UPI PIN डालने को कहता है। स्कैन या PIN डालने से पैसा सिर्फ़ जाता है, आता नहीं।',
    },
  },
  {
    id: 'task-job',
    weight: 3,
    test: (t) => has(t, ['like videos', 'rate hotels', 'part time job', 'work from home', 'daily earn', 'telegram task', 'घर बैठे', 'पार्ट टाइम']),
    why: {
      en: 'An easy "work from home" or "like videos and earn" offer. These end with you depositing money to "unlock" earnings.',
      hi: '"घर बैठे कमाई" या "वीडियो लाइक करके कमाओ" वाला ऑफ़र। इनमें आख़िर में कमाई "खोलने" के लिए पैसे जमा करवाते हैं।',
    },
  },
  {
    id: 'personal-number',
    weight: 1,
    test: (_t, raw) => /(?:^|\D)[6-9]\d{9}(?:\D|$)/.test(toAsciiDigits(raw)),
    why: {
      en: 'Gives a personal 10-digit mobile number to call. Banks and boards use short or toll-free numbers.',
      hi: 'कॉल करने के लिए 10 अंकों का निजी मोबाइल नंबर दिया है। बैंक और विभाग छोटे या टोल-फ़्री नंबर इस्तेमाल करते हैं।',
    },
  },
];

export interface ScamVerdict {
  risk: 'high' | 'medium' | 'low';
  score: number;
  flags: Array<{ id: string; why: string }>;
}

export function checkScam(text: string, lang: LangCode): ScamVerdict {
  const lower = toAsciiDigits(text.toLowerCase());
  const hits = SCAM_RULES.filter((r) => r.test(lower, text));
  // `link` is implied by `short-link`; do not double count.
  const flags = hits.filter((r) => !(r.id === 'link' && hits.some((h) => h.id === 'short-link')));
  const score = flags.reduce((s, r) => s + r.weight, 0);
  const risk: ScamVerdict['risk'] = score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { risk, score, flags: flags.map((r) => ({ id: r.id, why: pick(r.why, lang) })) };
}

function scamReport(v: ScamVerdict, lang: LangCode): string {
  const hi = lang === 'hi-IN';
  const head =
    v.risk === 'high'
      ? hi ? '**🔴 बहुत ज़्यादा ख़तरा — यह लगभग पक्का धोखा है।**' : '**🔴 High risk — this is almost certainly a scam.**'
      : v.risk === 'medium'
        ? hi ? '**🟠 सावधान — धोखे के निशान हैं।**' : '**🟠 Be careful — this has warning signs of fraud.**'
        : hi ? '**⚪ कोई जाना-पहचाना धोखे का निशान नहीं मिला।** इसका मतलब "सुरक्षित" नहीं है।' : '**⚪ No known warning signs found.** That does not mean it is safe.';

  const flags = v.flags.length
    ? v.flags.map((f) => `- ${f.why}`).join('\n')
    : hi ? '- फिर भी, कोई OTP या PIN किसी को न बताएँ।' : '- Even so, never share an OTP or PIN with anyone.';

  return `${head}\n\n${flags}`;
}

// ---------------------------------------------------------------------------
// Calculators
// ---------------------------------------------------------------------------

const PEOPLE_WORDS = ['people', 'persons', 'members', ' log', 'लोग', 'सदस्य', 'जन', 'of us'];

export interface Calc {
  ok: boolean;
  summary: string;
  input: string;
}

export function calcRation(text: string, lang: LangCode): Calc {
  const hi = lang === 'hi-IN';
  const lower = toAsciiDigits(text.toLowerCase());
  const aay = /\baay\b/.test(lower) || has(lower, ['antyodaya', 'अंत्योदय']);
  const nums = numbersIn(text);
  const people =
    nums.find((n) => has(n.after, PEOPLE_WORDS))?.value ??
    nums.find((n) => has(n.before, ['family of', 'we are', 'हम', 'परिवार में']) && n.value < 30)?.value;

  if (aay) {
    return {
      ok: true,
      input: `card=AAY${people ? ` people=${people}` : ''}`,
      summary: hi
        ? `**अंत्योदय (AAY) कार्ड: पूरे परिवार को हर महीने 35 किलो अनाज, मुफ़्त।** यह परिवार के सदस्यों की गिनती पर निर्भर नहीं है।`
        : `**Antyodaya (AAY) card: 35 kg of grain per month for the whole family, free.** It does not depend on family size.`,
    };
  }
  if (!people || people > 40) {
    return {
      ok: false,
      input: 'card=PHH people=?',
      summary: hi
        ? 'हिसाब के लिए बताइए कि कार्ड पर **कितने लोगों** के नाम हैं, और कार्ड अंत्योदय (AAY) है या प्राथमिकता वाला (PHH)। हर PHH सदस्य को महीने में 5 किलो मुफ़्त मिलता है।'
        : 'To work it out, tell me **how many people** are on the card and whether it is Antyodaya (AAY) or Priority (PHH). Each PHH member gets 5 kg a month free.',
    };
  }
  const kg = people * 5;
  return {
    ok: true,
    input: `card=PHH people=${people}`,
    summary: hi
      ? `**${people} लोग × 5 किलो = हर महीने ${kg} किलो अनाज, मुफ़्त।**\n\nमान्यता: कार्ड प्राथमिकता वाला (PHH) है और सभी ${people} नाम कार्ड पर दर्ज हैं। जिसका नाम कार्ड पर नहीं, उसका हिस्सा नहीं जुड़ता — नाम जुड़वाइए।`
      : `**${people} people × 5 kg = ${kg} kg of grain every month, free.**\n\nAssumes a Priority Household (PHH) card with all ${people} names on it. Anyone not on the card is not counted — get their name added.`,
  };
}

export function calcWages(text: string, lang: LangCode): Calc {
  const hi = lang === 'hi-IN';
  const lower = toAsciiDigits(text.toLowerCase());
  const nums = numbersIn(text);
  const dayWords = ['day', 'days', 'din', 'दिन', 'दिनों'];
  const rateWords = ['rupees a day', 'rs a day', 'per day', '/day', 'a day', 'daily', 'रोज़', 'रोज', 'प्रतिदिन', 'रुपये रोज', 'rupaye roz', 'dihadi', 'दिहाड़ी'];

  const isDays = (n: Num) => dayWords.some((w) => n.after.trimStart().startsWith(w));
  const isRupees = (n: Num) =>
    n.before.includes('₹') || n.before.endsWith('rs ') || n.before.endsWith('rs.') ||
    has(n.after.slice(0, 9), ['rupee', 'rs', 'रुपये', 'रुपए', 'rupaye', '/-']);

  const rate =
    nums.find((n) => !isDays(n) && has(n.after.slice(0, 18), rateWords))?.value ??
    nums.find((n) => !isDays(n) && isRupees(n) && n.value >= 50 && n.value <= 2000)?.value;
  const days = nums.find((n) => isDays(n) && n.value <= 366)?.value;
  const mgnrega = has(lower, ['mgnrega', 'nrega', 'manrega', 'मनरेगा', 'नरेगा', 'job card']);

  if (!days || !rate) {
    return {
      ok: false,
      input: `days=${days ?? '?'} rate=${rate ?? '?'}`,
      summary: hi
        ? 'हिसाब के लिए दो बातें बताइए: **कितने दिन** काम किया, और **रोज़ की मज़दूरी कितनी** तय हुई थी।'
        : 'To work it out, tell me two things: **how many days** you worked, and the **daily wage** you were promised.',
    };
  }
  const total = days * rate;
  const lines = [
    hi ? `**${days} दिन × ${inr(rate)} = ${inr(total)} बकाया।**` : `**${days} days × ${inr(rate)} = ${inr(total)} due.**`,
  ];
  if (mgnrega) {
    const left = Math.max(0, 100 - days);
    lines.push(
      hi
        ? `मनरेगा में परिवार को साल में 100 दिन काम का हक़ है — अभी **${left} दिन** और माँग सकते हैं। भुगतान 15 दिन में होना चाहिए; 16वें दिन के बाद देरी पर हर दिन बकाया का 0.05% मुआवज़ा बनता है।`
        : `Under MGNREGA your household is entitled to 100 days a year — you can still demand **${left} more days**. Payment is due within 15 days; after day 16 you are owed 0.05% of the unpaid amount per day of delay.`,
    );
  }
  lines.push(hi ? 'मान्यता: हर दिन पूरे दिन का काम था।' : 'Assumes every day was a full working day.');
  return { ok: true, input: `days=${days} rate=${rate}${mgnrega ? ' mgnrega' : ''}`, summary: lines.join('\n\n') };
}

export function calcInterest(text: string, lang: LangCode): Calc {
  const hi = lang === 'hi-IN';
  const lower = toAsciiDigits(text.toLowerCase());
  const nums = numbersIn(text);

  const perHundred = ['saikda', 'saikra', 'सैकड़ा', 'सैकड़े', 'per hundred', 'per 100', 'rupaye saikda', 'taka', 'टका'];
  const monthly = ['per month', 'a month', 'monthly', 'महीना', 'महीने', 'mahina', 'mahine', 'maheena'];
  const yearly = ['per year', 'a year', 'yearly', 'annual', 'साल', 'saal', 'सालाना'];

  let monthlyPct: number | undefined;
  let rateNum: number | undefined;
  for (const n of nums) {
    const near = n.after.slice(0, 16);
    const pct = n.after.trimStart().startsWith('%') || has(near, ['percent', 'प्रतिशत']);
    if (n.value <= 30 && (has(near, perHundred) || (pct && (has(n.after, monthly) || !has(n.after, yearly))))) {
      monthlyPct = n.value;
      rateNum = n.value;
      break;
    }
    if (n.value <= 300 && pct && has(n.after, yearly)) {
      monthlyPct = n.value / 12;
      rateNum = n.value;
      break;
    }
  }
  // "5 saikda" is always per month in village usage; "% per month" also.
  if (monthlyPct == null && has(lower, perHundred)) {
    rateNum = nums.find((n) => n.value > 0 && n.value <= 20)?.value;
    monthlyPct = rateNum;
  }

  const principal = nums
    .filter((n) => n.value !== rateNum && n.value >= 500)
    .sort((a, b) => b.value - a.value)[0]?.value;

  if (monthlyPct == null) {
    return {
      ok: false,
      input: `principal=${principal ?? '?'} rate=?`,
      summary: hi
        ? 'हिसाब के लिए बताइए: **कितना उधार** लिया, और ब्याज **कितने रुपये सैकड़ा महीना** (या कितने % महीना) है।'
        : 'To work it out, tell me **how much** you borrowed and the interest as **rupees per hundred per month** (or % per month).',
    };
  }

  const annual = monthlyPct * 12;
  const lines = [
    hi
      ? `**${monthlyPct} रुपये सैकड़ा महीना = साल का ${annual.toFixed(0)}% ब्याज।**`
      : `**${monthlyPct} per hundred per month = ${annual.toFixed(0)}% interest a year.**`,
  ];
  if (principal) {
    const yearCost = (principal * annual) / 100;
    lines.push(
      hi
        ? `${inr(principal)} पर सिर्फ़ ब्याज: **हर महीने ${inr(yearCost / 12)}, साल में ${inr(yearCost)}** — मूल रकम इसके ऊपर है।`
        : `On ${inr(principal)}, interest alone is **${inr(yearCost / 12)} a month, ${inr(yearCost)} a year** — before you repay a rupee of the loan itself.`,
    );
  }
  lines.push(
    hi
      ? 'तुलना: किसान क्रेडिट कार्ड का लोन समय पर चुकाने पर लगभग 4–7% सालाना पड़ता है। कई राज्यों के साहूकारी क़ानून इससे बहुत ऊँचे ब्याज को ग़ैरक़ानूनी मानते हैं।'
      : 'For comparison: a Kisan Credit Card loan costs about 4–7% a year when repaid on time. Many state money-lending laws treat rates far above that as illegal.',
  );
  lines.push(hi ? 'मान्यता: साधारण ब्याज, चक्रवृद्धि नहीं।' : 'Assumes simple interest, not compounding.');
  return { ok: true, input: `principal=${principal ?? '?'} monthly%=${monthlyPct}`, summary: lines.join('\n\n') };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export interface ToolOutcome {
  runs: ToolRun[];
  /** Markdown shown at the top of the answer, in the reply language. */
  report: string;
  /** Plain-English facts handed to the LLM so it explains, not recomputes. */
  facts: string;
}

/** Which calculator a calculator sub-agent maps to. */
const CALCS: Record<string, (t: string, l: LangCode) => Calc> = {
  'calculator.ration': calcRation,
  'calculator.wages': calcWages,
  'calculator.interest': calcInterest,
};

export function runTools(agentId: string, subId: string | undefined, text: string, lang: LangCode): ToolOutcome | null {
  if (agentId === 'scam') {
    const v = checkScam(text, lang);
    const en = checkScam(text, 'en-IN');
    return {
      runs: [
        {
          name: 'scam.patterns',
          input: text.slice(0, 160),
          output: `risk=${v.risk} score=${v.score} flags=[${v.flags.map((f) => f.id).join(', ')}]`,
        },
      ],
      report: scamReport(v, lang),
      facts: `Rules engine verdict: ${en.risk.toUpperCase()} risk (score ${en.score}). Red flags found:\n${
        en.flags.map((f) => `- ${f.why}`).join('\n') || '- none'
      }`,
    };
  }

  if (agentId === 'calculator') {
    const fn = CALCS[subId ?? ''] ?? calcRation;
    const r = fn(text, lang);
    const en = fn(text, 'en-IN');
    return {
      runs: [{ name: subId ?? 'calculator.ration', input: r.input, output: r.ok ? en.summary.replace(/\*\*/g, '').split('\n')[0] : 'missing input' }],
      report: r.summary,
      facts: `Calculator output (use exactly):\n${en.summary.replace(/\*\*/g, '')}`,
    };
  }

  return null;
}
