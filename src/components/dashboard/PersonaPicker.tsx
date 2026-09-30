import { motion } from 'motion/react';
import type { PersonaId } from '../../types';
import { PERSONAS, bi } from '../../dashboard/personas';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';

/**
 * Who the dashboard is for. Native radio inputs, so arrow keys, screen-reader
 * "1 of 8" announcements and form semantics all come for free. The selection
 * highlight slides between choices (shared-layout "animated tabs" pattern from
 * 21st.dev), and snaps instantly under reduced motion.
 */
export function PersonaPicker({ value, onChange }: { value: PersonaId; onChange: (id: PersonaId) => void }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-muted mb-2">{s('iAm')}</legend>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PERSONAS.map((p) => {
          const checked = value === p.id;
          return (
            <motion.label
              key={p.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2.5 min-h-[60px] rounded-xl border border-line bg-panel px-3 py-2 cursor-pointer
                         transition-colors hover:border-brand/60
                         has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-2"
            >
              {checked && (
                <motion.span
                  layoutId="persona-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-brand/10 ring-2 ring-brand"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <input
                type="radio"
                name="persona"
                value={p.id}
                checked={checked}
                onChange={() => onChange(p.id)}
                className="sr-only"
              />
              <motion.span
                aria-hidden="true"
                className="relative text-2xl leading-none"
                animate={checked ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.4 }}
              >
                {p.emoji}
              </motion.span>
              <span className="relative text-sm font-semibold leading-tight">{bi(p.name, settings.lang)}</span>
            </motion.label>
          );
        })}
      </div>
    </fieldset>
  );
}
