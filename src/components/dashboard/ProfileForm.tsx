import { useId } from 'react';
import type { Profile } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { makeT } from '../../i18n/strings';
import type { UiKey } from '../../i18n/strings';

type BoolKey = 'pregnant' | 'widow' | 'student' | 'incomeTaxPayer' | 'govtEmployee' | 'hasLpg' | 'puccaHouse' | 'formalJob';
type NumKey = 'age' | 'income' | 'landHectares' | 'disabilityPct';

const BOOLS: Array<[BoolKey, UiKey]> = [
  ['student', 'studentQ'],
  ['pregnant', 'pregnant'],
  ['widow', 'widow'],
  ['hasLpg', 'hasLpg'],
  ['puccaHouse', 'puccaHouse'],
  ['formalJob', 'formalJob'],
  ['govtEmployee', 'govtEmployee'],
  ['incomeTaxPayer', 'taxPayer'],
];

const NUMS: Array<[NumKey, UiKey, number, number, number]> = [
  ['age', 'age', 0, 120, 1],
  ['income', 'income', 0, 1000000, 500],
  ['landHectares', 'land', 0, 1000, 0.1],
  ['disabilityPct', 'disabilityPct', 0, 100, 5],
];

/**
 * Optional self-report for the eligibility checker. Every question can be left
 * unanswered — an unanswered rule makes a scheme "check at the office", never
 * "not eligible".
 */
export function ProfileForm({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  const base = useId();

  const setField = <K extends keyof Profile>(key: K, value: Profile[K] | undefined) => {
    const next = { ...profile };
    if (value === undefined) delete next[key];
    else next[key] = value as Profile[K];
    onChange(next);
  };

  const count = Object.keys(profile).length;

  return (
    <details className="card p-0 group">
      <summary className="cursor-pointer list-none flex items-center gap-2 min-h-[48px] px-4 font-semibold">
        <span aria-hidden="true">🧾</span>
        <span className="me-auto">{s('myProfile')}</span>
        {count > 0 && <span className="chip">{count}</span>}
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="px-4 pb-4">
        <p className="text-xs text-muted mb-3">{s('profileHint')}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {NUMS.map(([key, label, min, max, step]) => (
            <div key={key}>
              <label className="label" htmlFor={`${base}-${key}`}>
                {s(label)}
              </label>
              <input
                id={`${base}-${key}`}
                type="number"
                inputMode="decimal"
                className="field"
                min={min}
                max={max}
                step={step}
                value={profile[key] ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = Number(v);
                  setField(key, v === '' || !Number.isFinite(n) ? undefined : Math.min(max, Math.max(min, n)));
                }}
              />
            </div>
          ))}

          <div>
            <label className="label" htmlFor={`${base}-gender`}>
              {s('gender')}
            </label>
            <select
              id={`${base}-gender`}
              className="field"
              value={profile.gender ?? ''}
              onChange={(e) => setField('gender', (e.target.value || undefined) as Profile['gender'])}
            >
              <option value="">{s('notSaid')}</option>
              <option value="female">{s('female')}</option>
              <option value="male">{s('male')}</option>
              <option value="other">{s('otherGender')}</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor={`${base}-area`}>
              {s('area')}
            </label>
            <select
              id={`${base}-area`}
              className="field"
              value={profile.area ?? ''}
              onChange={(e) => setField('area', (e.target.value || undefined) as Profile['area'])}
            >
              <option value="">{s('notSaid')}</option>
              <option value="rural">{s('rural')}</option>
              <option value="urban">{s('urban')}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor={`${base}-ration`}>
              {s('rationCard')}
            </label>
            <select
              id={`${base}-ration`}
              className="field"
              value={profile.rationCard ?? ''}
              onChange={(e) => setField('rationCard', (e.target.value || undefined) as Profile['rationCard'])}
            >
              <option value="">{s('notSaid')}</option>
              <option value="aay">{s('rationAay')}</option>
              <option value="phh">{s('rationPhh')}</option>
              <option value="none">{s('rationNone')}</option>
            </select>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
          {BOOLS.map(([key, label]) => {
            const id = `${base}-${key}`;
            const v = profile[key];
            return (
              <li key={key} className="flex items-center gap-2">
                <label htmlFor={id} className="text-sm flex-1">
                  {s(label)}
                </label>
                <select
                  id={id}
                  className="field !w-32 !min-h-[44px]"
                  value={v === undefined ? '' : v ? 'yes' : 'no'}
                  onChange={(e) => setField(key, e.target.value === '' ? undefined : e.target.value === 'yes')}
                >
                  <option value="">{s('notSaid')}</option>
                  <option value="yes">{s('yes')}</option>
                  <option value="no">{s('no')}</option>
                </select>
              </li>
            );
          })}
        </ul>

        {count > 0 && (
          <button type="button" className="btn mt-4" onClick={() => onChange({})}>
            {s('clearProfile')}
          </button>
        )}
      </div>
    </details>
  );
}
