import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

export interface Quick {
  emoji: string;
  en: string;
  hi: string;
}

/** The problems this platform exists for, phrased the way a person says them. */
const QUICK: Quick[] = [
  { emoji: '🚨', en: 'My neighbour fell and is not waking up', hi: 'पड़ोसी गिर गए हैं और होश में नहीं आ रहे' },
  { emoji: '🌾', en: 'The ration shop keeps sending me away empty-handed', hi: 'राशन की दुकान हर बार खाली हाथ लौटा देती है' },
  { emoji: '⛺', en: 'Water is coming into our lane — where is the nearest shelter?', hi: 'हमारी गली में पानी आ रहा है — सबसे नज़दीक शरण कहाँ है?' },
  { emoji: '🩺', en: 'My child has fever and the private doctor wants ₹3000', hi: 'बच्चे को बुखार है और प्राइवेट डॉक्टर ₹3000 माँग रहा है' },
  { emoji: '🛡️', en: 'SMS says my electricity will be cut tonight, click this link to update', hi: 'मैसेज आया है कि आज रात बिजली कटेगी, लिंक पर क्लिक करके अपडेट करो' },
  { emoji: '🧮', en: 'We are 6 people on a PHH card, how much free grain should we get?', hi: 'हम PHH कार्ड पर 6 लोग हैं, कितना मुफ़्त अनाज मिलना चाहिए?' },
  { emoji: '🛠️', en: 'The contractor has not paid 18 days of wages', hi: 'ठेकेदार ने 18 दिन की मज़दूरी नहीं दी' },
  { emoji: '🗺️', en: 'Flood took our house, we lost the ration card, and my husband has not been paid for 20 days', hi: 'बाढ़ में घर गया, राशन कार्ड खो गया, और पति को 20 दिन से मज़दूरी नहीं मिली' },
];

export function QuickHelp({ onPick, extra = [] }: { onPick: (text: string) => void; extra?: Quick[] }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const hi = settings.lang === 'hi-IN';
  // Emergency always first; then the dashboard persona's own tasks; then the rest.
  const items = [QUICK[0], ...extra.slice(0, 3), ...QUICK.slice(1)].slice(0, 8);

  return (
    <section aria-labelledby="quick-heading" className="animate-fade-up pt-6">
      <h2 id="quick-heading" className="text-xl sm:text-2xl font-extrabold tracking-tight">
        {s('askTitle')}
      </h2>
      <p className="text-muted text-sm mt-1.5">{s('askSubtitle')}</p>

      <h3 className="sr-only-focusable">{s('quickHelp')}</h3>
      <ul className="mt-5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1" role="list">
        {items.map((q) => (
          <li key={q.en}>
            <button
              type="button"
              onClick={() => onPick(hi ? q.hi : q.en)}
              className="w-full text-start rounded-xl px-3 py-2.5 min-h-[44px] flex gap-2.5 items-start
                         text-sm leading-snug hover:bg-panel border border-transparent hover:border-line transition-colors"
            >
              <span aria-hidden="true" className="leading-5">
                {q.emoji}
              </span>
              <span>{hi ? q.hi : q.en}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
