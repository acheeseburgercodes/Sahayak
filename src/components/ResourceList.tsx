import type { ActionStep, ResourceCard } from '../types';
import { useSettings } from '../context/SettingsContext';
import { makeT } from '../i18n/strings';

const TONE: Record<NonNullable<ResourceCard['status']>['tone'], string> = {
  ok: 'border-ok text-ok',
  warn: 'border-warn text-warn',
  danger: 'border-danger text-danger',
  muted: 'border-line text-muted',
};

const KIND_ICON: Record<ResourceCard['kind'], string> = {
  'ration-shop': '🌾',
  shelter: '⛺',
  hospital: '🩺',
  helpline: '📞',
  office: '🏛️',
  'work-site': '🛠️',
};

export function ResourceList({ items, title }: { items: ResourceCard[]; title: string }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  if (items.length === 0) return null;

  return (
    <section className="mt-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-1.5">{title}</h4>
      <ul className="grid gap-2 sm:grid-cols-2" role="list">
        {items.map((r) => (
          <li key={r.id} className="card p-2.5">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="text-base leading-none mt-0.5">
                {KIND_ICON[r.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-snug">{r.name}</p>
                <p className="text-xs text-muted mt-0.5">{r.detail}</p>
                {r.address && <p className="text-xs mt-1">📍 {r.address}</p>}
                {r.hours && <p className="text-xs">🕑 {r.hours}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {r.status && (
                    <span className={`chip ${TONE[r.status.tone]}`}>{r.status.label}</span>
                  )}
                  {r.distanceKm != null && (
                    <span className="text-xs text-muted">
                      {r.distanceKm} km {s('distanceAway')}
                    </span>
                  )}
                </div>
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className="btn btn-primary mt-2 w-full text-sm"
                    aria-label={`${s('callNow')} ${r.name} ${r.phone}`}
                  >
                    <span aria-hidden="true">📞</span> {s('callNow')} {r.phone}
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StepList({ steps }: { steps: ActionStep[] }) {
  const { settings } = useSettings();
  const s = makeT(settings.lang);
  if (steps.length === 0) return null;

  return (
    <section className="mt-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-1.5">{s('steps')}</h4>
      <ol className="space-y-2" role="list">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="grid place-items-center shrink-0 h-6 w-6 rounded-full bg-brand text-brandInk text-xs font-bold"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm">{step.text}</p>
              {step.carry && step.carry.length > 0 && (
                <p className="text-xs text-muted mt-1">
                  <span className="font-semibold">{s('carry')}:</span> {step.carry.join(' · ')}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
