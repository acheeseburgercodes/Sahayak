import type { PersonaId, Profile, WorkerId } from '../types';
import type { Bi } from './personas';

/**
 * Government scheme catalogue for the dashboard.
 *
 * Benefit lines describe the scheme's national design in plain words; states
 * add top-ups and notify their own dates, so amounts that vary are described
 * rather than quoted. Official URLs are the scheme's own portal. Before this
 * serves real users, sync against myScheme / the scheme portals — schemes are
 * revised every budget.
 */

export type Category =
  | 'money'
  | 'insurance'
  | 'food'
  | 'health'
  | 'housing'
  | 'pension'
  | 'education'
  | 'work'
  | 'credit'
  | 'identity';

export const CATEGORY_LABEL: Record<Category, Bi & { emoji: string }> = {
  money: { emoji: '💸', en: 'Cash support', hi: 'नक़द सहायता' },
  insurance: { emoji: '🛡️', en: 'Insurance', hi: 'बीमा' },
  food: { emoji: '🌾', en: 'Food', hi: 'भोजन' },
  health: { emoji: '🩺', en: 'Health', hi: 'स्वास्थ्य' },
  housing: { emoji: '🏠', en: 'Housing & fuel', hi: 'घर और ईंधन' },
  pension: { emoji: '🧓', en: 'Pension', hi: 'पेंशन' },
  education: { emoji: '🎓', en: 'Education & skills', hi: 'शिक्षा और कौशल' },
  work: { emoji: '🛠️', en: 'Work & wages', hi: 'काम और मज़दूरी' },
  credit: { emoji: '🏦', en: 'Loans & banking', hi: 'लोन और बैंक' },
  identity: { emoji: '🪪', en: 'Cards & registration', hi: 'कार्ड और पंजीकरण' },
};

/** Documents, named once so the checklist and the tracker agree. */
export type DocId =
  | 'aadhaar' | 'bank' | 'mobile' | 'photo' | 'land' | 'income' | 'caste' | 'ration'
  | 'marksheet' | 'feeReceipt' | 'disability' | 'age' | 'deathCert' | 'vending' | 'sowing'
  | 'mcp' | 'address';

export const DOCS: Record<DocId, Bi> = {
  aadhaar: { en: 'Aadhaar card', hi: 'आधार कार्ड' },
  bank: { en: 'Bank passbook (Aadhaar-linked account)', hi: 'बैंक पासबुक (आधार से जुड़ा खाता)' },
  mobile: { en: 'Mobile number linked to Aadhaar', hi: 'आधार से जुड़ा मोबाइल नंबर' },
  photo: { en: 'Passport-size photo', hi: 'पासपोर्ट साइज़ फ़ोटो' },
  land: { en: 'Land record (khatauni / 7-12 / patta)', hi: 'ज़मीन का रिकॉर्ड (खतौनी / 7-12 / पट्टा)' },
  income: { en: 'Income certificate', hi: 'आय प्रमाण पत्र' },
  caste: { en: 'Caste certificate (if it applies)', hi: 'जाति प्रमाण पत्र (अगर लागू हो)' },
  ration: { en: 'Ration card', hi: 'राशन कार्ड' },
  marksheet: { en: 'Last marksheet', hi: 'पिछली मार्कशीट' },
  feeReceipt: { en: 'Fee receipt', hi: 'फ़ीस रसीद' },
  disability: { en: 'Disability certificate', hi: 'दिव्यांगता प्रमाण पत्र' },
  age: { en: 'Age proof', hi: 'उम्र का सबूत' },
  deathCert: { en: "Husband's death certificate", hi: 'पति का मृत्यु प्रमाण पत्र' },
  vending: { en: 'Vending certificate or municipality letter', hi: 'वेंडिंग सर्टिफ़िकेट या नगर निकाय का पत्र' },
  sowing: { en: 'Sowing declaration / crop details', hi: 'बुआई का विवरण' },
  mcp: { en: 'Mother & child protection (MCP) card', hi: 'माँ-बच्चा सुरक्षा (MCP) कार्ड' },
  address: { en: 'Address proof', hi: 'पते का सबूत' },
};

export type VerdictStatus = 'likely' | 'check' | 'no';

export interface Verdict {
  status: VerdictStatus;
  reasons: Bi[];
}

export interface Scheme {
  id: string;
  name: Bi;
  category: Category;
  personas: PersonaId[];
  benefit: Bi;
  /** Teammate (and sub-agent) that answers questions about this scheme. */
  agent: WorkerId;
  sub?: string;
  url?: string;
  helpline?: string;
  docs: DocId[];
  check: (p: Profile, persona: PersonaId) => Verdict;
}

// ---- tiny rule helpers --------------------------------------------------------

const r = (en: string, hi: string): Bi => ({ en, hi });

/**
 * Build a verdict from rule outcomes: any `no` wins, then any unknown, else
 * likely. `assumed` is for exclusion rules ("not a tax payer") — most poor
 * households pass them, so an unanswered one does not block "likely", but the
 * reason says it was assumed.
 */
function decide(rules: Array<[boolean | undefined | 'assumed', Bi, Bi?]>): Verdict {
  const reasons: Bi[] = [];
  let status: VerdictStatus = 'likely';
  for (const [ok, pass, fail] of rules) {
    if (ok === 'assumed') {
      reasons.push(r(`${pass.en} (assumed — tell us if not)`, `${pass.hi} (माना गया — ग़लत हो तो बताइए)`));
    } else if (ok === undefined) {
      if (status !== 'no') status = 'check';
      reasons.push(r(`Not answered yet: ${pass.en.toLowerCase()}`, `अभी नहीं बताया: ${pass.hi}`));
    } else if (ok) {
      reasons.push(pass);
    } else {
      status = 'no';
      reasons.push(fail ?? r(`Does not meet: ${pass.en.toLowerCase()}`, `शर्त पूरी नहीं: ${pass.hi}`));
    }
  }
  return { status, reasons };
}

const between = (v: number | undefined, lo: number, hi: number) => (v == null ? undefined : v >= lo && v <= hi);
const not = (v: boolean | undefined) => (v == null ? undefined : !v);
/** Exclusion rule: unanswered counts as passing, flagged as assumed. */
const notEx = (v: boolean | undefined): boolean | 'assumed' => (v == null ? 'assumed' : !v);
const hasLand = (p: Profile) => (p.landHectares == null ? undefined : p.landHectares > 0);
const lowIncome = (p: Profile, perMonth: number) => (p.income == null ? undefined : p.income <= perMonth);
/** Tax payers are excluded from most welfare. */
const notTaxPayer = (p: Profile) => notEx(p.incomeTaxPayer);

/** A scheme with a judgement call at the office: never better than "check". */
function atBest(check: Verdict, note: Bi): Verdict {
  return {
    status: check.status === 'likely' ? 'check' : check.status,
    reasons: [...check.reasons, note],
  };
}

// ---- catalogue -----------------------------------------------------------------

export const SCHEMES: Scheme[] = [
  // Farmers
  {
    id: 'pm-kisan', category: 'money', personas: ['farmer'],
    name: r('PM-KISAN', 'PM-किसान'),
    benefit: r('₹6,000 a year in three instalments, paid straight to the bank account of landholding farmer families.', 'भूमिधारक किसान परिवारों को साल में ₹6,000, तीन किस्तों में सीधे बैंक खाते में।'),
    agent: 'farmer', sub: 'farmer.income', url: 'https://pmkisan.gov.in', helpline: '155261',
    docs: ['aadhaar', 'land', 'bank', 'mobile'],
    check: (p) =>
      decide([
        [hasLand(p), r('Owns cultivable land', 'खेती की ज़मीन अपने नाम'), r('Needs land in the family\u2019s name', 'परिवार के नाम ज़मीन होनी चाहिए')],
        [notTaxPayer(p), r('Not an income-tax payer', 'आयकर नहीं भरते'), r('Income-tax payers are excluded', 'आयकर भरने वाले बाहर हैं')],
        [notEx(p.govtEmployee), r('Not a government employee', 'सरकारी कर्मचारी नहीं'), r('Serving government employees are excluded', 'सरकारी कर्मचारी बाहर हैं')],
      ]),
  },
  {
    id: 'pmfby', category: 'insurance', personas: ['farmer'],
    name: r('PM Fasal Bima Yojana (crop insurance)', 'PM फसल बीमा योजना'),
    benefit: r('Crop insurance at a low farmer premium (about 2% kharif, 1.5% rabi). Tenant farmers and sharecroppers can join too.', 'कम प्रीमियम पर फसल बीमा (खरीफ़ लगभग 2%, रबी 1.5%)। बटाईदार और किराएदार किसान भी जुड़ सकते हैं।'),
    agent: 'farmer', sub: 'farmer.insurance', url: 'https://pmfby.gov.in', helpline: '14447',
    docs: ['aadhaar', 'land', 'bank', 'sowing'],
    check: (p, persona) =>
      p.landHectares === 0 && persona !== 'farmer'
        ? { status: 'no', reasons: [r('For people who grow a crop', 'फसल उगाने वालों के लिए')] }
        : decide([[hasLand(p) ?? (persona === 'farmer' ? true : undefined), r('Grows a notified crop (own or leased land)', 'अधिसूचित फसल उगाते हैं (अपनी या बटाई की ज़मीन)')]]),
  },
  {
    id: 'kcc', category: 'credit', personas: ['farmer'],
    name: r('Kisan Credit Card', 'किसान क्रेडिट कार्ड'),
    benefit: r('Cheap crop, dairy and fishery loans from any bank; timely repayment keeps interest very low.', 'किसी भी बैंक से फसल, डेयरी और मछली पालन के लिए सस्ता कर्ज़; समय पर चुकाने पर ब्याज बहुत कम।'),
    agent: 'farmer', sub: 'farmer.credit',
    docs: ['aadhaar', 'land', 'photo', 'bank'],
    check: (p) =>
      atBest(
        decide([[hasLand(p), r('Farms own or leased land', 'अपनी या बटाई की ज़मीन पर खेती')]]),
        r('The bank sanctions the limit', 'सीमा बैंक तय करता है'),
      ),
  },
  {
    id: 'pm-kmy', category: 'pension', personas: ['farmer'],
    name: r('PM Kisan Maandhan (farmer pension)', 'PM किसान मानधन (किसान पेंशन)'),
    benefit: r('₹3,000 a month pension from age 60 for small farmers who join between 18 and 40 and pay a small monthly share.', '18 से 40 की उम्र में जुड़कर छोटा मासिक अंशदान देने वाले छोटे किसानों को 60 के बाद ₹3,000 महीना पेंशन।'),
    agent: 'farmer', url: 'https://maandhan.in',
    docs: ['aadhaar', 'land', 'bank'],
    check: (p) =>
      decide([
        [between(p.age, 18, 40), r('Aged 18 to 40', 'उम्र 18 से 40')],
        [p.landHectares == null ? undefined : p.landHectares > 0 && p.landHectares <= 2, r('Up to 2 hectares of land', '2 हेक्टेयर तक ज़मीन')],
      ]),
  },
  {
    id: 'soil-health', category: 'identity', personas: ['farmer'],
    name: r('Soil Health Card', 'मृदा स्वास्थ्य कार्ड'),
    benefit: r('Free soil test that says exactly which fertiliser your field needs — saves money on inputs.', 'मुफ़्त मिट्टी जाँच, जो बताती है खेत को कौन सी खाद कितनी चाहिए — खाद का ख़र्च बचता है।'),
    agent: 'farmer', sub: 'farmer.soil', url: 'https://soilhealth.dac.gov.in', helpline: '1800-180-1551',
    docs: ['aadhaar', 'land'],
    check: (p) => decide([[hasLand(p), r('Has a field to test', 'जाँच के लिए खेत है')]]),
  },

  // Workers
  {
    id: 'mgnrega', category: 'work', personas: ['worker', 'family', 'women'],
    name: r('MGNREGA — 100 days of work', 'मनरेगा — 100 दिन का काम'),
    benefit: r('Up to 100 days of paid work a year for every rural household, within 15 days of asking, near home.', 'हर ग्रामीण परिवार को साल में 100 दिन तक मज़दूरी वाला काम, माँगने के 15 दिन में, घर के पास।'),
    agent: 'livelihood', url: 'https://nrega.nic.in', helpline: '1800-110-001',
    docs: ['aadhaar', 'photo', 'bank'],
    check: (p) =>
      decide([
        [p.area == null ? undefined : p.area === 'rural', r('Lives in a rural area', 'गाँव में रहते हैं'), r('Only for rural households', 'सिर्फ़ ग्रामीण परिवारों के लिए')],
        [p.age == null ? undefined : p.age >= 18, r('Adult (18+)', 'वयस्क (18+)')],
      ]),
  },
  {
    id: 'e-shram', category: 'identity', personas: ['worker', 'vendor', 'women'],
    name: r('e-Shram card', 'ई-श्रम कार्ड'),
    benefit: r('Free national ID for unorganised workers; the gateway to worker schemes and accident cover.', 'असंगठित मज़दूरों का मुफ़्त राष्ट्रीय कार्ड; मज़दूर योजनाओं और दुर्घटना बीमा का रास्ता।'),
    agent: 'livelihood', url: 'https://eshram.gov.in', helpline: '14434',
    docs: ['aadhaar', 'mobile', 'bank'],
    check: (p) =>
      decide([
        [between(p.age, 16, 59), r('Aged 16 to 59', 'उम्र 16 से 59')],
        [notEx(p.formalJob), r('No PF / ESIC job', 'PF / ESIC वाली नौकरी नहीं'), r('Workers with PF or ESIC are excluded', 'PF या ESIC वाले बाहर हैं')],
        [notTaxPayer(p), r('Not an income-tax payer', 'आयकर नहीं भरते')],
      ]),
  },
  {
    id: 'pm-sym', category: 'pension', personas: ['worker', 'vendor', 'women'],
    name: r('PM Shram Yogi Maandhan', 'PM श्रम योगी मानधन'),
    benefit: r('₹3,000 a month pension after 60 for unorganised workers who join young; the government matches your contribution.', 'कम उम्र में जुड़ने वाले असंगठित मज़दूरों को 60 के बाद ₹3,000 महीना पेंशन; जितना आप देंगे उतना सरकार भी देगी।'),
    agent: 'livelihood', url: 'https://maandhan.in',
    docs: ['aadhaar', 'bank', 'mobile'],
    check: (p) =>
      decide([
        [between(p.age, 18, 40), r('Aged 18 to 40', 'उम्र 18 से 40')],
        [lowIncome(p, 15000), r('Earns up to ₹15,000 a month', '₹15,000 महीना तक कमाई')],
        [notEx(p.formalJob), r('No PF / ESIC job', 'PF / ESIC वाली नौकरी नहीं')],
        [notTaxPayer(p), r('Not an income-tax payer', 'आयकर नहीं भरते')],
      ]),
  },

  // Food & health
  {
    id: 'nfsa', category: 'food', personas: ['family', 'worker', 'senior', 'women', 'disability'],
    name: r('Free ration (NFSA / PMGKAY)', 'मुफ़्त राशन (NFSA / PMGKAY)'),
    benefit: r('5 kg of free grain per person every month (35 kg per family on an Antyodaya card), usable anywhere in India.', 'हर व्यक्ति को हर महीने 5 किलो मुफ़्त अनाज (अंत्योदय कार्ड पर परिवार को 35 किलो), पूरे भारत में कहीं भी।'),
    agent: 'ration', url: 'https://nfsa.gov.in', helpline: '1967',
    docs: ['aadhaar', 'ration', 'income', 'photo'],
    check: (p) => {
      if (p.rationCard === 'aay' || p.rationCard === 'phh') {
        return { status: 'likely', reasons: [r('You already hold an NFSA card — collect every month', 'आपके पास NFSA कार्ड है — हर महीने लीजिए')] };
      }
      return atBest(
        decide([
          [notTaxPayer(p), r('Not an income-tax payer', 'आयकर नहीं भरते')],
          [lowIncome(p, 15000), r('Low household income', 'परिवार की आय कम')],
        ]),
        r('States set the income limits and the card quota', 'आय सीमा और कार्ड का कोटा राज्य तय करता है'),
      );
    },
  },
  {
    id: 'pm-jay', category: 'health', personas: ['family', 'senior', 'women', 'worker', 'disability'],
    name: r('Ayushman Bharat PM-JAY', 'आयुष्मान भारत PM-JAY'),
    benefit: r('Free hospital treatment up to ₹5 lakh per family per year at empanelled hospitals. Everyone aged 70+ is covered regardless of income.', 'सूचीबद्ध अस्पतालों में हर परिवार को साल में ₹5 लाख तक मुफ़्त इलाज। 70+ उम्र के सभी लोग, आय चाहे जो हो।'),
    agent: 'health', url: 'https://beneficiary.nha.gov.in', helpline: '1800-111-565',
    docs: ['aadhaar', 'ration', 'mobile'],
    check: (p) => {
      if (p.age != null && p.age >= 70) {
        return { status: 'likely', reasons: [r('Aged 70+: covered irrespective of income', '70+ उम्र: आय चाहे जो हो, शामिल')] };
      }
      if (p.rationCard === 'aay') {
        return { status: 'likely', reasons: [r('Antyodaya card holders are covered', 'अंत्योदय कार्ड वाले शामिल हैं')] };
      }
      return atBest(
        decide([[lowIncome(p, 15000), r('Low household income', 'परिवार की आय कम')]]),
        r('Your name must be in the beneficiary list — check with Aadhaar on the portal', 'आपका नाम लाभार्थी सूची में होना चाहिए — पोर्टल पर आधार से जाँचिए'),
      );
    },
  },
  {
    id: 'pmmvy', category: 'money', personas: ['women'],
    name: r('PM Matru Vandana Yojana', 'PM मातृ वंदना योजना'),
    benefit: r('Cash for pregnant women and new mothers, paid to the bank account — for the first child, and for a second child who is a girl.', 'गर्भवती महिलाओं और नई माताओं को बैंक खाते में नक़द — पहले बच्चे के लिए, और दूसरी बार बेटी होने पर।'),
    agent: 'health', sub: 'health.maternal', url: 'https://pmmvy.wcd.gov.in',
    docs: ['aadhaar', 'mcp', 'bank', 'mobile'],
    check: (p) =>
      decide([
        [p.gender == null ? undefined : p.gender === 'female', r('Is a woman', 'महिला हैं'), r('For the mother herself', 'माँ के नाम पर')],
        [p.pregnant, r('Pregnant or recently delivered', 'गर्भवती या हाल में प्रसव'), r('Only during pregnancy / after delivery', 'सिर्फ़ गर्भावस्था / प्रसव के बाद')],
        [notEx(p.govtEmployee), r('Not a regular government employee', 'नियमित सरकारी कर्मचारी नहीं')],
      ]),
  },

  // Housing & fuel
  {
    id: 'ujjwala', category: 'housing', personas: ['women', 'family'],
    name: r('PM Ujjwala (free LPG connection)', 'PM उज्ज्वला (मुफ़्त गैस कनेक्शन)'),
    benefit: r('A free LPG connection in the name of an adult woman of a poor household, with a subsidy on refills.', 'ग़रीब परिवार की वयस्क महिला के नाम मुफ़्त गैस कनेक्शन, रिफ़िल पर सब्सिडी के साथ।'),
    agent: 'documents', url: 'https://pmuy.gov.in',
    docs: ['aadhaar', 'ration', 'bank', 'address'],
    check: (p) =>
      decide([
        [p.gender == null ? undefined : p.gender === 'female' ? true : undefined, r('An adult woman of the household applies', 'परिवार की वयस्क महिला आवेदन करती है')],
        [not(p.hasLpg), r('No LPG connection at home yet', 'घर में अभी गैस कनेक्शन नहीं'), r('The household already has LPG', 'घर में पहले से गैस है')],
      ]),
  },
  {
    id: 'pmay', category: 'housing', personas: ['family', 'worker', 'vendor'],
    name: r('PM Awas Yojana (pucca house)', 'PM आवास योजना (पक्का घर)'),
    benefit: r('Money to build or buy a pucca house for families without one — rural (PMAY-G) or urban (PMAY-U).', 'जिनके पास पक्का घर नहीं, उन्हें घर बनाने या ख़रीदने के लिए सहायता — ग्रामीण (PMAY-G) या शहरी (PMAY-U)।'),
    agent: 'documents', url: 'https://pmay-urban.gov.in',
    docs: ['aadhaar', 'income', 'bank', 'land'],
    check: (p) =>
      atBest(
        decide([
          [not(p.puccaHouse), r('No pucca house in the family', 'परिवार के पास पक्का घर नहीं'), r('Families with a pucca house are excluded', 'पक्के घर वाले परिवार बाहर हैं')],
          [lowIncome(p, 25000), r('Low household income', 'परिवार की आय कम')],
        ]),
        r('Rural lists come from a survey; urban needs an application', 'ग्रामीण सूची सर्वे से बनती है; शहरी में आवेदन होता है'),
      ),
  },

  // Pensions & disability
  {
    id: 'old-age-pension', category: 'pension', personas: ['senior'],
    name: r('Old-age pension (NSAP / state)', 'वृद्धावस्था पेंशन (NSAP / राज्य)'),
    benefit: r('A monthly pension for poor people aged 60+, paid by the centre and topped up by the state.', '60+ उम्र के ग़रीब लोगों को हर महीने पेंशन, केंद्र की राशि के ऊपर राज्य भी जोड़ता है।'),
    agent: 'documents', sub: 'documents.pension', url: 'https://nsap.nic.in', helpline: '14567',
    docs: ['aadhaar', 'age', 'bank', 'ration', 'photo'],
    check: (p) =>
      decide([
        [p.age == null ? undefined : p.age >= 60, r('Aged 60+', 'उम्र 60+')],
        [p.rationCard === 'aay' || p.rationCard === 'phh' ? true : lowIncome(p, 10000), r('Poor household (BPL / NFSA card)', 'ग़रीब परिवार (BPL / NFSA कार्ड)')],
      ]),
  },
  {
    id: 'widow-pension', category: 'pension', personas: ['women', 'senior'],
    name: r('Widow pension', 'विधवा पेंशन'),
    benefit: r('A monthly pension for widows from poor households, with state top-ups.', 'ग़रीब परिवार की विधवा महिलाओं को हर महीने पेंशन, राज्य की अतिरिक्त राशि के साथ।'),
    agent: 'documents', sub: 'documents.pension', url: 'https://nsap.nic.in',
    docs: ['aadhaar', 'deathCert', 'age', 'bank', 'ration'],
    check: (p) =>
      decide([
        [p.widow, r('Is a widow', 'विधवा हैं'), r('Only for widows', 'सिर्फ़ विधवा महिलाओं के लिए')],
        [p.age == null ? undefined : p.age >= 18, r('Adult', 'वयस्क')],
      ]),
  },
  {
    id: 'udid', category: 'identity', personas: ['disability'],
    name: r('UDID card (disability ID)', 'UDID कार्ड (दिव्यांग पहचान)'),
    benefit: r('One national disability card and certificate — the key to pensions, aids, concessions and reservations.', 'एक राष्ट्रीय दिव्यांग कार्ड और प्रमाण पत्र — पेंशन, उपकरण, रियायत और आरक्षण की चाबी।'),
    agent: 'documents', url: 'https://www.swavlambancard.gov.in',
    docs: ['aadhaar', 'photo', 'address'],
    check: (p) => decide([[p.disabilityPct == null ? undefined : p.disabilityPct > 0, r('Has a disability', 'दिव्यांगता है'), r('For persons with disability', 'दिव्यांगजनों के लिए')]]),
  },
  {
    id: 'disability-pension', category: 'pension', personas: ['disability'],
    name: r('Disability pension', 'दिव्यांग पेंशन'),
    benefit: r('Monthly pension for persons with severe disability (80%+ under the central scheme; many states pay from 40%).', 'गंभीर दिव्यांगता पर हर महीने पेंशन (केंद्र की योजना में 80%+; कई राज्य 40% से देते हैं)।'),
    agent: 'documents', sub: 'documents.pension', url: 'https://nsap.nic.in',
    docs: ['aadhaar', 'disability', 'bank', 'ration'],
    check: (p) => {
      if (p.disabilityPct != null && p.disabilityPct >= 40 && p.disabilityPct < 80) {
        return { status: 'check', reasons: [r('40–79%: depends on your state\u2019s scheme', '40–79%: राज्य की योजना पर निर्भर')] };
      }
      return decide([
        [p.disabilityPct == null ? undefined : p.disabilityPct >= 80, r('80% or more disability', '80% या ज़्यादा दिव्यांगता')],
        [between(p.age, 18, 79), r('Aged 18 to 79', 'उम्र 18 से 79')],
      ]);
    },
  },

  // Education
  {
    id: 'nsp', category: 'education', personas: ['student', 'disability'],
    name: r('National Scholarship Portal', 'राष्ट्रीय छात्रवृत्ति पोर्टल'),
    benefit: r('Pre-matric, post-matric and merit scholarships from the centre and many states, in one application.', 'केंद्र और कई राज्यों की प्री-मैट्रिक, पोस्ट-मैट्रिक और मेरिट छात्रवृत्तियाँ, एक ही आवेदन में।'),
    agent: 'education', sub: 'education.scholarship', url: 'https://scholarships.gov.in',
    docs: ['aadhaar', 'bank', 'income', 'caste', 'marksheet', 'feeReceipt'],
    check: (p) =>
      decide([
        [p.student, r('Currently studying', 'अभी पढ़ाई कर रहे हैं'), r('Only for students', 'सिर्फ़ छात्रों के लिए')],
        [lowIncome(p, 20833), r('Family income up to about ₹2.5 lakh a year', 'परिवार की आय साल में लगभग ₹2.5 लाख तक')],
      ]),
  },
  {
    id: 'skill-india', category: 'education', personas: ['student', 'worker', 'women', 'disability'],
    name: r('Skill India / PMKVY free training', 'स्किल इंडिया / PMKVY मुफ़्त ट्रेनिंग'),
    benefit: r('Free short job courses with a certificate, and apprenticeships that pay a monthly stipend.', 'सर्टिफ़िकेट के साथ मुफ़्त छोटे रोज़गार कोर्स, और हर महीने वज़ीफ़े वाली अप्रेंटिसशिप।'),
    agent: 'education', sub: 'education.skills', url: 'https://www.skillindiadigital.gov.in',
    docs: ['aadhaar', 'marksheet', 'bank', 'photo'],
    check: (p) => decide([[between(p.age, 15, 45), r('Aged 15 to 45', 'उम्र 15 से 45')]]),
  },

  // Vendors & artisans
  {
    id: 'svanidhi', category: 'credit', personas: ['vendor'],
    name: r('PM SVANidhi (street vendor loan)', 'PM स्वनिधि (रेहड़ी-पटरी लोन)'),
    benefit: r('Collateral-free working-capital loans in rising tranches, interest subsidy and cashback on digital payments.', 'बिना गारंटी बढ़ती किस्तों में कामकाजी पूँजी का लोन, ब्याज में छूट और डिजिटल भुगतान पर कैशबैक।'),
    agent: 'enterprise', sub: 'enterprise.vendor', url: 'https://pmsvanidhi.mohua.gov.in',
    docs: ['aadhaar', 'mobile', 'bank', 'vending'],
    check: (p, persona) =>
      decide([
        [persona === 'vendor' ? true : undefined, r('Works as a street vendor', 'रेहड़ी-पटरी पर काम')],
        [p.area == null ? undefined : p.area === 'urban', r('Vends in a town or city', 'शहर या क़स्बे में धंधा'), r('Covers urban street vendors', 'शहरी रेहड़ी-पटरी वालों के लिए')],
      ]),
  },
  {
    id: 'vishwakarma', category: 'credit', personas: ['vendor'],
    name: r('PM Vishwakarma', 'PM विश्वकर्मा'),
    benefit: r('For traditional artisans: certificate and ID, training with a daily stipend, a toolkit voucher and cheap collateral-free loans.', 'पारंपरिक कारीगरों के लिए: प्रमाण पत्र और पहचान पत्र, रोज़ के वज़ीफ़े वाली ट्रेनिंग, औज़ार का वाउचर और बिना गारंटी सस्ता लोन।'),
    agent: 'enterprise', sub: 'enterprise.artisan', url: 'https://pmvishwakarma.gov.in',
    docs: ['aadhaar', 'mobile', 'bank', 'ration'],
    check: (p) =>
      atBest(
        decide([
          [p.age == null ? undefined : p.age >= 18, r('Aged 18+', 'उम्र 18+')],
          [notEx(p.govtEmployee), r('No one in the family is a government employee', 'परिवार में कोई सरकारी कर्मचारी नहीं')],
        ]),
        r('Your trade must be one of the listed traditional trades', 'आपका काम सूची के पारंपरिक कामों में होना चाहिए'),
      ),
  },
  {
    id: 'mudra', category: 'credit', personas: ['vendor', 'women', 'student'],
    name: r('Mudra loan', 'मुद्रा लोन'),
    benefit: r('Collateral-free business loans from any bank: Shishu (smallest), Kishore and Tarun.', 'किसी भी बैंक से बिना गारंटी कारोबार लोन: शिशु (सबसे छोटा), किशोर और तरुण।'),
    agent: 'enterprise', sub: 'enterprise.loan', url: 'https://www.mudra.org.in',
    docs: ['aadhaar', 'bank', 'photo', 'address'],
    check: (p) =>
      atBest(
        decide([[p.age == null ? undefined : p.age >= 18, r('Aged 18+', 'उम्र 18+')]]),
        r('The bank decides based on your business plan', 'फ़ैसला बैंक आपके कारोबार के प्लान पर करता है'),
      ),
  },

  // Everyone
  {
    id: 'jan-dhan', category: 'credit', personas: ['family', 'worker', 'women', 'vendor', 'senior', 'student', 'disability', 'farmer'],
    name: r('Jan Dhan bank account', 'जन धन बैंक खाता'),
    benefit: r('A zero-balance bank account with a RuPay card and accident cover — needed to receive almost every benefit.', 'बिना न्यूनतम राशि का बैंक खाता, RuPay कार्ड और दुर्घटना बीमा के साथ — लगभग हर लाभ पाने के लिए ज़रूरी।'),
    agent: 'money', url: 'https://pmjdy.gov.in',
    docs: ['aadhaar', 'photo', 'mobile'],
    check: () => ({ status: 'likely', reasons: [r('Any resident can open one, free', 'कोई भी निवासी मुफ़्त खोल सकता है')] }),
  },
  {
    id: 'pmsby', category: 'insurance', personas: ['family', 'worker', 'women', 'vendor', 'farmer', 'disability'],
    name: r('PM Suraksha Bima (₹20/year accident cover)', 'PM सुरक्षा बीमा (₹20 सालाना दुर्घटना बीमा)'),
    benefit: r('₹2 lakh accident insurance for about ₹20 a year, auto-debited from your bank account.', 'साल के लगभग ₹20 में ₹2 लाख का दुर्घटना बीमा, सीधे बैंक खाते से कटता है।'),
    agent: 'money', url: 'https://jansuraksha.gov.in',
    docs: ['aadhaar', 'bank'],
    check: (p) => decide([[between(p.age, 18, 70), r('Aged 18 to 70', 'उम्र 18 से 70')]]),
  },
  {
    id: 'apy', category: 'pension', personas: ['worker', 'vendor', 'women', 'farmer'],
    name: r('Atal Pension Yojana', 'अटल पेंशन योजना'),
    benefit: r('A guaranteed pension of ₹1,000–5,000 a month from 60, for a small monthly saving started young.', 'कम उम्र से छोटी मासिक बचत पर 60 के बाद ₹1,000–5,000 महीना पक्की पेंशन।'),
    agent: 'money', url: 'https://www.npscra.nsdl.co.in',
    docs: ['aadhaar', 'bank', 'mobile'],
    check: (p) =>
      decide([
        [between(p.age, 18, 40), r('Aged 18 to 40', 'उम्र 18 से 40')],
        [notTaxPayer(p), r('Not an income-tax payer', 'आयकर नहीं भरते'), r('Income-tax payers cannot join', 'आयकर भरने वाले नहीं जुड़ सकते')],
      ]),
  },
];

export const SCHEME_BY_ID: Record<string, Scheme> = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));

const ORDER: Record<VerdictStatus, number> = { likely: 0, check: 1, no: 2 };

/** Schemes for a persona, best matches first. `all` includes other personas' schemes. */
export function schemesFor(
  persona: PersonaId,
  profile: Profile,
  opts: { all?: boolean } = {},
): Array<{ scheme: Scheme; verdict: Verdict; mine: boolean }> {
  return SCHEMES.map((scheme) => ({
    scheme,
    verdict: scheme.check(profile, persona),
    mine: scheme.personas.includes(persona),
  }))
    .filter((x) => opts.all || x.mine)
    .sort((a, b) => Number(b.mine) - Number(a.mine) || ORDER[a.verdict.status] - ORDER[b.verdict.status]);
}
