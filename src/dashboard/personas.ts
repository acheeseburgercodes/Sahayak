import type { PersonaId, Profile, WorkerId } from '../types';

export interface Bi {
  en: string;
  hi: string;
}

/** A one-tap task on the dashboard. It becomes a question to the AI team. */
export interface QuickService {
  id: string;
  emoji: string;
  label: Bi;
  prompt: Bi;
  agent: WorkerId;
  sub?: string;
  /** Official self-service page, when one exists. */
  url?: string;
}

export interface Persona {
  id: PersonaId;
  emoji: string;
  name: Bi;
  blurb: Bi;
  /** Teammate that answers first when a question matches nothing specific. */
  lead: WorkerId;
  /** Teammates shown as "your team" for this audience, lead first. */
  team: WorkerId[];
  services: QuickService[];
  /** Profile facts implied by the persona, used when the user has not said. */
  implied?: Partial<Profile>;
  /** National helpline names (see lib/data HELPLINES) worth pinning for them. */
  helplines: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'farmer',
    emoji: '🚜',
    name: { en: 'Farmer', hi: 'किसान' },
    blurb: {
      en: 'Income support, crop insurance, cheap credit, soil tests and selling at MSP.',
      hi: 'आय सहायता, फसल बीमा, सस्ता कर्ज़, मिट्टी जाँच और MSP पर बिक्री।',
    },
    lead: 'farmer',
    team: ['farmer', 'money', 'documents', 'calculator'],
    implied: { area: 'rural' },
    helplines: ['155261', '14447', '1800-180-1551'],
    services: [
      {
        id: 'pmkisan-status', emoji: '💸', agent: 'farmer', sub: 'farmer.income',
        label: { en: 'PM-KISAN instalment not received', hi: 'PM-KISAN की किस्त नहीं आई' },
        prompt: { en: 'My PM-KISAN instalment has not come. What should I check and where do I go?', hi: 'मेरी PM-KISAN की किस्त नहीं आई। क्या जाँचूँ और कहाँ जाऊँ?' },
        url: 'https://pmkisan.gov.in',
      },
      {
        id: 'crop-loss', emoji: '🌧️', agent: 'farmer', sub: 'farmer.insurance',
        label: { en: 'Report crop loss', hi: 'फसल नुकसान की सूचना दें' },
        prompt: { en: 'Hailstorm damaged my crop. How do I claim crop insurance?', hi: 'ओलों से मेरी फसल ख़राब हो गई। फसल बीमा का दावा कैसे करूँ?' },
        url: 'https://pmfby.gov.in',
      },
      {
        id: 'kcc', emoji: '💳', agent: 'farmer', sub: 'farmer.credit',
        label: { en: 'Get a Kisan Credit Card', hi: 'किसान क्रेडिट कार्ड बनवाएँ' },
        prompt: { en: 'How can I get a Kisan Credit Card and what documents are needed?', hi: 'किसान क्रेडिट कार्ड कैसे बनेगा और कौन से कागज़ चाहिए?' },
      },
      {
        id: 'mandi', emoji: '⚖️', agent: 'farmer', sub: 'farmer.market',
        label: { en: 'Sell at MSP / mandi prices', hi: 'MSP पर बेचना / मंडी भाव' },
        prompt: { en: 'How do I sell my wheat at MSP and see mandi prices?', hi: 'अपना गेहूँ MSP पर कैसे बेचूँ और मंडी भाव कहाँ देखूँ?' },
        url: 'https://enam.gov.in',
      },
    ],
  },
  {
    id: 'worker',
    emoji: '🛠️',
    name: { en: 'Worker & migrant', hi: 'मज़दूर और प्रवासी' },
    blurb: {
      en: 'Wages, MGNREGA work, e-Shram card, pension for unorganised workers, ration away from home.',
      hi: 'मज़दूरी, मनरेगा काम, ई-श्रम कार्ड, असंगठित मज़दूरों की पेंशन, घर से दूर राशन।',
    },
    lead: 'livelihood',
    team: ['livelihood', 'ration', 'money', 'grievance'],
    helplines: ['1800-110-001', '14434', '14445'],
    services: [
      {
        id: 'wages', emoji: '🪙', agent: 'livelihood',
        label: { en: 'Wages not paid', hi: 'मज़दूरी नहीं मिली' },
        prompt: { en: 'The contractor has not paid my wages for 18 days. What can I do?', hi: 'ठेकेदार ने 18 दिन की मज़दूरी नहीं दी। मैं क्या करूँ?' },
      },
      {
        id: 'eshram', emoji: '🪪', agent: 'livelihood',
        label: { en: 'Make an e-Shram card', hi: 'ई-श्रम कार्ड बनवाएँ' },
        prompt: { en: 'How do I register for an e-Shram card and what does it give me?', hi: 'ई-श्रम कार्ड कैसे बनवाऊँ और इससे क्या मिलता है?' },
        url: 'https://eshram.gov.in',
      },
      {
        id: 'onorc', emoji: '🌾', agent: 'ration', sub: 'ration.portability',
        label: { en: 'Ration in another state', hi: 'दूसरे राज्य में राशन' },
        prompt: { en: 'I moved to another state for work, can I get ration here?', hi: 'मैं काम के लिए दूसरे राज्य आया हूँ, क्या यहाँ राशन मिलेगा?' },
      },
      {
        id: 'mgnrega-job', emoji: '📒', agent: 'livelihood',
        label: { en: 'Ask for MGNREGA work', hi: 'मनरेगा में काम माँगें' },
        prompt: { en: 'How do I get a job card and demand MGNREGA work in my village?', hi: 'जॉब कार्ड कैसे बनेगा और गाँव में मनरेगा का काम कैसे माँगूँ?' },
        url: 'https://nrega.nic.in',
      },
    ],
  },
  {
    id: 'women',
    emoji: '👩',
    name: { en: 'Women & mothers', hi: 'महिलाएँ और माताएँ' },
    blurb: {
      en: 'Pregnancy benefits, free delivery, free LPG connection, safety and SHG loans.',
      hi: 'गर्भावस्था लाभ, मुफ़्त प्रसव, मुफ़्त गैस कनेक्शन, सुरक्षा और स्वयं सहायता समूह लोन।',
    },
    lead: 'health',
    team: ['health', 'documents', 'emergency', 'money'],
    implied: { gender: 'female' },
    helplines: ['181', '104', '1800-111-565'],
    services: [
      {
        id: 'maternity', emoji: '🤰', agent: 'health', sub: 'health.maternal',
        label: { en: 'Pregnancy money & free delivery', hi: 'गर्भावस्था का पैसा और मुफ़्त प्रसव' },
        prompt: { en: 'My wife is pregnant, is delivery free in the government hospital and what money do we get?', hi: 'पत्नी गर्भवती है, क्या सरकारी अस्पताल में प्रसव मुफ़्त है और कितना पैसा मिलता है?' },
      },
      {
        id: 'ujjwala', emoji: '🔥', agent: 'documents',
        label: { en: 'Free gas connection (Ujjwala)', hi: 'मुफ़्त गैस कनेक्शन (उज्ज्वला)' },
        prompt: { en: 'How do I get a free LPG connection under Ujjwala?', hi: 'उज्ज्वला योजना में मुफ़्त गैस कनेक्शन कैसे मिलेगा?' },
        url: 'https://pmuy.gov.in',
      },
      {
        id: 'safety', emoji: '🛟', agent: 'emergency', sub: 'emergency.violence',
        label: { en: 'I am not safe at home', hi: 'मैं घर में सुरक्षित नहीं हूँ' },
        prompt: { en: 'My husband is beating me, I need help tonight', hi: 'पति मुझे मारते हैं, आज रात मदद चाहिए' },
      },
    ],
  },
  {
    id: 'senior',
    emoji: '👴',
    name: { en: 'Senior citizen', hi: 'बुज़ुर्ग' },
    blurb: {
      en: 'Old-age pension, free treatment for everyone over 70, Elder Line and life certificates.',
      hi: 'वृद्धावस्था पेंशन, 70 से ऊपर सभी का मुफ़्त इलाज, एल्डर लाइन और जीवन प्रमाण पत्र।',
    },
    lead: 'documents',
    team: ['documents', 'health', 'money', 'grievance'],
    implied: { age: 65 },
    helplines: ['14567', '1800-111-565', '104'],
    services: [
      {
        id: 'old-pension', emoji: '🧓', agent: 'documents', sub: 'documents.pension',
        label: { en: 'Old-age pension', hi: 'वृद्धावस्था पेंशन' },
        prompt: { en: 'My mother is 70 and gets no pension, she only has Aadhaar. How do we apply?', hi: 'माँ 70 साल की हैं, पेंशन नहीं मिलती, सिर्फ़ आधार है। आवेदन कैसे करें?' },
        url: 'https://nsap.nic.in',
      },
      {
        id: 'vay-vandana', emoji: '🏥', agent: 'health',
        label: { en: 'Free treatment card for 70+', hi: '70+ के लिए मुफ़्त इलाज कार्ड' },
        prompt: { en: 'My father is 72. How does he get the Ayushman card for free treatment?', hi: 'पिताजी 72 साल के हैं। मुफ़्त इलाज का आयुष्मान कार्ड कैसे बनेगा?' },
        url: 'https://beneficiary.nha.gov.in',
      },
      {
        id: 'pension-stopped', emoji: '⛔', agent: 'grievance',
        label: { en: 'Pension stopped', hi: 'पेंशन रुक गई' },
        prompt: { en: 'My pension stopped three months ago and the office keeps sending me back', hi: 'तीन महीने से पेंशन रुकी है और दफ़्तर हर बार लौटा देता है' },
      },
    ],
  },
  {
    id: 'student',
    emoji: '🎓',
    name: { en: 'Student & youth', hi: 'छात्र और युवा' },
    blurb: {
      en: 'Scholarships, free school seats, skill courses and paid apprenticeships.',
      hi: 'छात्रवृत्ति, मुफ़्त स्कूल सीट, कौशल कोर्स और वज़ीफ़े वाली अप्रेंटिसशिप।',
    },
    lead: 'education',
    team: ['education', 'documents', 'enterprise', 'scam'],
    implied: { student: true },
    helplines: ['1947', '1930'],
    services: [
      {
        id: 'scholarship', emoji: '📚', agent: 'education', sub: 'education.scholarship',
        label: { en: 'Find a scholarship', hi: 'छात्रवृत्ति खोजें' },
        prompt: { en: 'I passed class 12 and my family is poor. Which scholarship can I get?', hi: 'मैंने 12वीं पास की है और परिवार ग़रीब है। कौन सी छात्रवृत्ति मिल सकती है?' },
        url: 'https://scholarships.gov.in',
      },
      {
        id: 'rte', emoji: '🏫', agent: 'education', sub: 'education.school',
        label: { en: 'Free seat in a private school', hi: 'निजी स्कूल में मुफ़्त सीट' },
        prompt: { en: 'How do I get a free RTE seat for my son in a private school?', hi: 'बेटे के लिए निजी स्कूल में RTE की मुफ़्त सीट कैसे मिलेगी?' },
      },
      {
        id: 'skills', emoji: '🧰', agent: 'education', sub: 'education.skills',
        label: { en: 'Free skill training', hi: 'मुफ़्त कौशल प्रशिक्षण' },
        prompt: { en: 'I want free training for a trade that gets a job quickly', hi: 'जल्दी नौकरी दिलाने वाले काम की मुफ़्त ट्रेनिंग चाहिए' },
        url: 'https://www.skillindiadigital.gov.in',
      },
      {
        id: 'job-scam', emoji: '🛡️', agent: 'scam',
        label: { en: 'Is this job offer real?', hi: 'क्या यह नौकरी का ऑफ़र असली है?' },
        prompt: { en: 'A message offers a part time job from home but asks a 2000 rupee registration fee. Is it real?', hi: 'मैसेज में घर से पार्ट टाइम नौकरी का ऑफ़र है पर 2000 रुपये रजिस्ट्रेशन फीस माँग रहे हैं। क्या यह असली है?' },
      },
    ],
  },
  {
    id: 'disability',
    emoji: '♿',
    name: { en: 'Person with disability', hi: 'दिव्यांगजन' },
    blurb: {
      en: 'UDID card, disability pension, free aids and appliances, reserved seats and jobs.',
      hi: 'UDID कार्ड, दिव्यांग पेंशन, मुफ़्त सहायक उपकरण, आरक्षित सीटें और नौकरियाँ।',
    },
    lead: 'documents',
    team: ['documents', 'health', 'education', 'grievance'],
    helplines: ['104', '15100'],
    services: [
      {
        id: 'udid', emoji: '🪪', agent: 'documents',
        label: { en: 'Get a UDID / disability card', hi: 'UDID / दिव्यांग कार्ड बनवाएँ' },
        prompt: { en: 'How do I get a disability certificate and UDID card?', hi: 'दिव्यांग प्रमाण पत्र और UDID कार्ड कैसे बनेगा?' },
        url: 'https://www.swavlambancard.gov.in',
      },
      {
        id: 'dis-pension', emoji: '💰', agent: 'documents', sub: 'documents.pension',
        label: { en: 'Disability pension', hi: 'दिव्यांग पेंशन' },
        prompt: { en: 'I have 80 percent disability. How do I apply for disability pension?', hi: 'मुझे 80 प्रतिशत दिव्यांगता है। दिव्यांग पेंशन के लिए आवेदन कैसे करूँ?' },
      },
      {
        id: 'aids', emoji: '🦽', agent: 'health',
        label: { en: 'Free wheelchair or hearing aid', hi: 'मुफ़्त व्हीलचेयर या सुनने की मशीन' },
        prompt: { en: 'Where can I get a free wheelchair or hearing aid from the government?', hi: 'सरकार से मुफ़्त व्हीलचेयर या सुनने की मशीन कहाँ मिलेगी?' },
      },
    ],
  },
  {
    id: 'vendor',
    emoji: '🧺',
    name: { en: 'Vendor & artisan', hi: 'रेहड़ी-पटरी और कारीगर' },
    blurb: {
      en: 'Loans without collateral, PM Vishwakarma toolkits and training, free business registration.',
      hi: 'बिना गारंटी लोन, PM विश्वकर्मा औज़ार और ट्रेनिंग, मुफ़्त कारोबार पंजीकरण।',
    },
    lead: 'enterprise',
    team: ['enterprise', 'money', 'documents', 'calculator'],
    implied: { area: 'urban' },
    helplines: ['1930', '15100'],
    services: [
      {
        id: 'svanidhi', emoji: '🛒', agent: 'enterprise', sub: 'enterprise.vendor',
        label: { en: 'Street vendor loan', hi: 'रेहड़ी-पटरी लोन' },
        prompt: { en: 'I sell vegetables on a cart. Can I get a loan without a guarantee?', hi: 'मैं ठेले पर सब्ज़ी बेचता हूँ। क्या बिना गारंटी लोन मिलेगा?' },
        url: 'https://pmsvanidhi.mohua.gov.in',
      },
      {
        id: 'vishwakarma', emoji: '🪚', agent: 'enterprise', sub: 'enterprise.artisan',
        label: { en: 'PM Vishwakarma for artisans', hi: 'कारीगरों के लिए PM विश्वकर्मा' },
        prompt: { en: 'I am a carpenter, what is PM Vishwakarma and how do I join?', hi: 'मैं बढ़ई हूँ, PM विश्वकर्मा क्या है और कैसे जुड़ूँ?' },
        url: 'https://pmvishwakarma.gov.in',
      },
      {
        id: 'daily-loan', emoji: '🧮', agent: 'calculator', sub: 'calculator.interest',
        label: { en: 'What does my daily loan cost?', hi: 'रोज़ वाले लोन का असली ब्याज?' },
        prompt: { en: 'Moneylender gave 10000 at 5 rupees saikda per month, how much interest in a year?', hi: 'साहूकार ने 10000 रुपये 5 रुपये सैकड़ा महीना पर दिए, साल में कितना ब्याज?' },
      },
    ],
  },
  {
    id: 'family',
    emoji: '🏠',
    name: { en: 'Low-income family', hi: 'कम आय वाला परिवार' },
    blurb: {
      en: 'Free ration, ₹5 lakh free treatment, a pucca house, bank account and low-cost insurance.',
      hi: 'मुफ़्त राशन, ₹5 लाख तक मुफ़्त इलाज, पक्का घर, बैंक खाता और सस्ता बीमा।',
    },
    lead: 'ration',
    team: ['ration', 'health', 'documents', 'shelter', 'planner'],
    helplines: ['1967', '1800-111-565', '1078'],
    services: [
      {
        id: 'ration-refused', emoji: '🌾', agent: 'ration', sub: 'ration.dealer',
        label: { en: 'Ration shop refuses me', hi: 'राशन दुकान मना करती है' },
        prompt: { en: 'The ration dealer says my card is blocked and sends me away every time', hi: 'राशन डीलर कहता है कार्ड ब्लॉक है और हर बार लौटा देता है' },
      },
      {
        id: 'new-ration', emoji: '📇', agent: 'ration', sub: 'ration.new-card',
        label: { en: 'Apply for a ration card', hi: 'राशन कार्ड का आवेदन' },
        prompt: { en: 'We have no ration card. How do we apply for one?', hi: 'हमारे पास राशन कार्ड नहीं है। आवेदन कैसे करें?' },
        url: 'https://nfsa.gov.in',
      },
      {
        id: 'ayushman', emoji: '🩺', agent: 'health',
        label: { en: 'Ayushman card for free treatment', hi: 'मुफ़्त इलाज का आयुष्मान कार्ड' },
        prompt: { en: 'How do I check if my family has an Ayushman card and get it made?', hi: 'कैसे पता करूँ कि परिवार का आयुष्मान कार्ड है, और कैसे बनवाऊँ?' },
        url: 'https://beneficiary.nha.gov.in',
      },
      {
        id: 'house', emoji: '🧱', agent: 'documents',
        label: { en: 'Pucca house (PM Awas)', hi: 'पक्का घर (PM आवास)' },
        prompt: { en: 'We live in a kutcha house. How do we get a house under PM Awas Yojana?', hi: 'हम कच्चे घर में रहते हैं। PM आवास योजना में घर कैसे मिलेगा?' },
      },
    ],
  },
];

export const PERSONA_BY_ID: Record<PersonaId, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<PersonaId, Persona>;

export function personaOf(id: PersonaId | undefined): Persona {
  return PERSONA_BY_ID[id ?? 'family'] ?? PERSONA_BY_ID.family;
}

/**
 * Pick the hand-written Hindi or the English text. Other languages get
 * English in the dashboard shell; the AI team still answers in their language.
 */
export function bi(text: Bi, lang: string): string {
  return lang === 'hi-IN' ? text.hi : text.en;
}
