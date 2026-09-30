import type { PersonaId } from '../types';
import type { Bi } from './personas';

/**
 * Season calendar. Months are 0-based. These are the TYPICAL windows; each
 * state notifies exact dates every year, so the UI always says "usually".
 */
export interface SeasonEvent {
  id: string;
  months: number[];
  label: Bi;
  detail: Bi;
  personas: PersonaId[];
  tone: 'act' | 'money' | 'info';
}

export const SEASON_EVENTS: SeasonEvent[] = [
  {
    id: 'kharif-insure', months: [5, 6], personas: ['farmer'], tone: 'act',
    label: { en: 'Kharif crop insurance enrolment', hi: 'खरीफ़ फसल बीमा पंजीकरण' },
    detail: { en: 'Usually closes around 31 July.', hi: 'आमतौर पर 31 जुलाई के आसपास बंद।' },
  },
  {
    id: 'rabi-insure', months: [9, 10, 11], personas: ['farmer'], tone: 'act',
    label: { en: 'Rabi crop insurance enrolment', hi: 'रबी फसल बीमा पंजीकरण' },
    detail: { en: 'Usually closes mid to late December.', hi: 'आमतौर पर दिसंबर के मध्य से अंत तक बंद।' },
  },
  {
    id: 'kisan-1', months: [3, 4, 5, 6], personas: ['farmer'], tone: 'money',
    label: { en: 'PM-KISAN instalment period 1', hi: 'PM-KISAN किस्त अवधि 1' },
    detail: { en: 'April–July. Keep e-KYC done before it.', hi: 'अप्रैल–जुलाई। इससे पहले e-KYC पूरी रखें।' },
  },
  {
    id: 'kisan-2', months: [7, 8, 9, 10], personas: ['farmer'], tone: 'money',
    label: { en: 'PM-KISAN instalment period 2', hi: 'PM-KISAN किस्त अवधि 2' },
    detail: { en: 'August–November.', hi: 'अगस्त–नवंबर।' },
  },
  {
    id: 'kisan-3', months: [11, 0, 1, 2], personas: ['farmer'], tone: 'money',
    label: { en: 'PM-KISAN instalment period 3', hi: 'PM-KISAN किस्त अवधि 3' },
    detail: { en: 'December–March.', hi: 'दिसंबर–मार्च।' },
  },
  {
    id: 'wheat-msp', months: [3, 4, 5], personas: ['farmer'], tone: 'info',
    label: { en: 'Wheat procurement at MSP', hi: 'MSP पर गेहूँ की ख़रीद' },
    detail: { en: 'Register on your state procurement portal before harvest.', hi: 'कटाई से पहले राज्य के ख़रीद पोर्टल पर पंजीकरण करें।' },
  },
  {
    id: 'paddy-msp', months: [9, 10, 11, 0], personas: ['farmer'], tone: 'info',
    label: { en: 'Paddy procurement at MSP', hi: 'MSP पर धान की ख़रीद' },
    detail: { en: 'Dates vary by state.', hi: 'तारीख़ें राज्य के हिसाब से।' },
  },
  {
    id: 'nsp-window', months: [6, 7, 8, 9], personas: ['student', 'disability'], tone: 'act',
    label: { en: 'Scholarship portal usually open', hi: 'छात्रवृत्ति पोर्टल आमतौर पर खुला' },
    detail: { en: 'Keep the bank account and income certificate ready before it opens.', hi: 'खुलने से पहले बैंक खाता और आय प्रमाण पत्र तैयार रखें।' },
  },
  {
    id: 'rte-admission', months: [0, 1, 2, 3], personas: ['student', 'family'], tone: 'act',
    label: { en: 'RTE free-seat admissions', hi: 'RTE मुफ़्त सीट दाख़िले' },
    detail: { en: 'Most states open the RTE portal early in the year.', hi: 'ज़्यादातर राज्य साल की शुरुआत में RTE पोर्टल खोलते हैं।' },
  },
  {
    id: 'life-cert', months: [10], personas: ['senior'], tone: 'act',
    label: { en: 'Life certificate for pensioners', hi: 'पेंशनरों का जीवन प्रमाण पत्र' },
    detail: { en: 'Many pensions need it every November; face authentication works from home.', hi: 'कई पेंशन में हर नवंबर ज़रूरी; चेहरे से घर बैठे भी होता है।' },
  },
  {
    id: 'monsoon', months: [5, 6, 7, 8], personas: ['family', 'farmer', 'worker'], tone: 'info',
    label: { en: 'Monsoon: know your nearest shelter', hi: 'मानसून: पास का आश्रय जानें' },
    detail: { en: 'Flood season in most states. 1078 is the disaster helpline.', hi: 'ज़्यादातर राज्यों में बाढ़ का मौसम। आपदा हेल्पलाइन 1078।' },
  },
];

export const MONTHS: Bi[] = [
  { en: 'Jan', hi: 'जन' }, { en: 'Feb', hi: 'फ़र' }, { en: 'Mar', hi: 'मार्च' }, { en: 'Apr', hi: 'अप्रै' },
  { en: 'May', hi: 'मई' }, { en: 'Jun', hi: 'जून' }, { en: 'Jul', hi: 'जुला' }, { en: 'Aug', hi: 'अग' },
  { en: 'Sep', hi: 'सित' }, { en: 'Oct', hi: 'अक्टू' }, { en: 'Nov', hi: 'नव' }, { en: 'Dec', hi: 'दिस' },
];

export function eventsFor(persona: PersonaId): SeasonEvent[] {
  return SEASON_EVENTS.filter((e) => e.personas.includes(persona));
}
