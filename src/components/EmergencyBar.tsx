import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

const CALLS = [
  { number: '112', labelEn: 'Any emergency', labelHi: 'कोई भी आपातकाल' },
  { number: '108', labelEn: 'Ambulance', labelHi: 'एम्बुलेंस' },
  { number: '1098', labelEn: 'Child in danger', labelHi: 'बच्चा ख़तरे में' },
  { number: '181', labelEn: 'Women helpline', labelHi: 'महिला हेल्पलाइन' },
];

/**
 * Always-visible, always-first. Someone in a real emergency must not have to
 * read the page, choose a language, or type a question to get a number.
 * Kept slim so the rest of the UI can stay quiet — but never hidden.
 */
export function EmergencyBar() {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const hi = settings.lang === 'hi-IN';

  return (
    <div className="bg-danger text-white" role="region" aria-label={s('emergencyBar')}>
      <div className="mx-auto max-w-7xl px-3 py-1 flex items-center gap-1 overflow-x-auto thin-scroll">
        <span className="text-xs font-bold uppercase tracking-wide me-1 shrink-0">
          <span aria-hidden="true">🚨 </span>
          {s('emergencyBar')}
        </span>
        {CALLS.map((c) => (
          <a
            key={c.number}
            href={`tel:${c.number}`}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] rounded-md px-2.5 font-bold
                       hover:bg-white/20 transition-colors"
            aria-label={`${s('callNow')} ${c.number} — ${hi ? c.labelHi : c.labelEn}`}
          >
            {c.number}
            <span className="text-xs font-normal opacity-90 hidden sm:inline">
              {hi ? c.labelHi : c.labelEn}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
