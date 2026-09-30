import { useId } from 'react';
import { LANGUAGES } from '../i18n/languages';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';
import { useAnnounce } from '../context/AnnouncerContext';
import type { LangCode } from '../types';

/**
 * Language is the first-class control, not a setting buried in a menu — the
 * whole premise is that the user speaks a regional language.
 */
export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { settings, set } = useSettings();
  const s = makeT(settings.lang);
  const announce = useAnnounce();
  const id = useId();

  return (
    <div className={compact ? '' : 'space-y-2'}>
      <label className={compact ? 'sr-only-focusable' : 'label'} htmlFor={id}>
        {s('language')}
      </label>
      <select
        id={id}
        className="field pe-8 font-semibold"
        value={settings.lang}
        onChange={(e) => {
          const code = e.target.value as LangCode;
          set('lang', code);
          const lang = LANGUAGES.find((l) => l.code === code);
          announce(`Language changed to ${lang?.english ?? code}`);
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native} — {l.english}
          </option>
        ))}
      </select>
      {!compact && (
        <p className="text-xs text-muted">
          {LANGUAGES.find((l) => l.code === settings.lang)?.region}
        </p>
      )}
    </div>
  );
}
