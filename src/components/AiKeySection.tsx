import { useEffect, useId, useState } from 'react';
import { currentPlatform, supportsKeyEntry } from '../lib/platform';
import { clearKey, getKeyStatus, saveKey, type KeyStatus } from '../lib/sarvamKey';
import { probeSarvam } from '../lib/sarvam';

/**
 * Sarvam key entry for the desktop and Android apps. The web build keeps its
 * key in the proxy's .env, so this renders nothing there.
 */
export function AiKeySection({ announce }: { announce: (msg: string) => void }) {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const id = useId();
  const platform = currentPlatform();

  useEffect(() => {
    if (supportsKeyEntry()) void getKeyStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  if (!supportsKeyEntry()) return null;

  const apply = async (fn: () => Promise<KeyStatus>, done: string) => {
    setBusy(true);
    setError('');
    try {
      const st = await fn();
      setStatus(st);
      setDraft('');
      const live = await probeSarvam();
      announce(live ? `${done}. Live AI answers are on.` : `${done}. Using offline answers.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the key.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="mb-5">
      <legend className="text-xs font-bold uppercase tracking-wide text-muted mb-2">AI connection</legend>
      <p className="text-sm mb-2" aria-live="polite">
        {status?.configured ? '● Sarvam key saved — live answers in 11 languages.' : '○ No key — offline answers only.'}
      </p>
      <label className="label" htmlFor={`${id}-key`}>
        Sarvam API key
      </label>
      <input
        id={`${id}-key`}
        type="password"
        autoComplete="off"
        spellCheck={false}
        className="field"
        value={draft}
        placeholder={status?.configured ? 'Replace the saved key' : 'Paste your key'}
        onChange={(e) => setDraft(e.target.value)}
        aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm text-danger mt-1">
          {error}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !draft.trim()}
          onClick={() => void apply(() => saveKey(draft), 'Key saved')}
        >
          Save key
        </button>
        {status?.configured && (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void apply(clearKey, 'Key removed')}
          >
            Remove
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted mt-1">
        {platform === 'desktop'
          ? status?.encrypted === false
            ? 'Stored on this PC only. OS encryption is unavailable here, so it is saved unencrypted in your user profile.'
            : 'Encrypted with your Windows account and kept on this PC only. The app window never sees it.'
          : 'Saved privately inside this app on this phone and sent only to Sarvam. Use your own key — do not share a phone with it saved.'}
      </p>
    </fieldset>
  );
}
