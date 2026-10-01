import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { useEngine } from '../context/EngineContext.jsx';
import ErrorBanner from './ErrorBanner.jsx';
import { cx } from '../utils/format.js';

const KEY_URL = 'https://aistudio.google.com/app/apikey';

/**
 * The single place a Gemini API key is ever requested.
 *
 * Rendered on every surface that needs Real Vision AI Mode. The key is posted
 * straight to the Express API, validated against Google, and held in server
 * memory — it is never written to localStorage and never returned to the page.
 */
export default function ApiKeyPanel({
  variant = 'inline',
  autoFocus = false,
  onConnected,
  className = ''
}) {
  const { status, engineConfigured, keySource, keyHint, connect, disconnect, loading } = useEngine();

  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!engineConfigured) setOpen(true);
  }, [engineConfigured]);

  const trimmed = apiKey.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (trimmed.length < 20) {
      setError(new Error('That does not look like a Gemini API key. Keys are 39 characters long.'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await connect(trimmed);
      setApiKey('');
      setRevealed(false);
      setSuccess(`Connected. Real Vision AI Mode is live on ${result.model}.`);
      onConnected?.(result);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await disconnect();
      setSuccess(
        result.configured
          ? 'Runtime key removed. The server is back to the environment key.'
          : 'Runtime key removed. Add a key to enable Real Vision AI Mode.'
      );
      setConfirmClear(false);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const compact = variant === 'compact';

  return (
    <section
      className={cx(
        'rounded-2xl border p-4',
        engineConfigured ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-amber-400/40 bg-amber-400/[0.07]',
        className
      )}
      aria-label="Gemini API key"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cx(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
              engineConfigured ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'
            )}
          >
            <KeyRound className={cx('h-4 w-4', engineConfigured ? 'text-emerald-400' : 'text-amber-300')} />
          </span>
          <div>
            <h2 className={cx('font-bold text-white', compact ? 'text-sm' : 'text-base')}>Gemini API key</h2>
            <p className="text-[11px] text-slate-400">
              {loading
                ? 'Checking engine status…'
                : engineConfigured
                  ? `Real Vision AI Mode active · ${keyHint ?? 'key loaded'}`
                  : 'Required for Real Vision AI Mode — Demo Mode works without one'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {engineConfigured && (
            <span className="chip !border-emerald-400/40 !text-emerald-300">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {keySource === 'runtime' ? 'Session key' : 'Server env key'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
            aria-expanded={open}
          >
            {open ? 'Hide' : engineConfigured ? 'Replace' : 'Add key'}
          </button>
        </div>
      </header>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-white/10 pt-4" noValidate>
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
          {success && (
            <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {success}
            </p>
          )}

          <div>
            <label htmlFor="gemini-api-key" className="label">
              Paste your key
            </label>
            <div className="relative">
              <input
                id="gemini-api-key"
                type={revealed ? 'text' : 'password'}
                className="field !pr-10 font-mono !text-xs"
                placeholder="AIza…"
                value={apiKey}
                autoFocus={autoFocus}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setError(null);
                }}
                aria-describedby="gemini-api-key-help"
              />
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:text-slate-200"
                aria-label={revealed ? 'Hide API key' : 'Show API key'}
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p id="gemini-api-key-help" className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Get a key from{' '}
              <a
                href={KEY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-vision-300 hover:text-vision-200"
              >
                Google AI Studio
              </a>
              . It is sent once to the VisionX server, validated against Google, and held in server
              memory only.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={submitting || trimmed.length === 0} className="btn-primary !py-2 !text-xs">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              {submitting ? 'Validating…' : 'Connect engine'}
            </button>

            {keySource === 'runtime' &&
              (confirmClear ? (
                <>
                  <button type="button" onClick={handleClear} disabled={submitting} className="btn-danger !py-2 !text-xs">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirm removal
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="btn-ghost !py-2 !text-xs">
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} className="btn-ghost !py-2 !text-xs">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove session key
                </button>
              ))}

            <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Server-side only
            </span>
          </div>

          {status?.limits && (
            <p className="text-[10px] text-slate-600">
              Engine: {status.model ?? 'not connected'} · {Math.round(status.limits.max_upload_bytes / 1024 / 1024)}MB
              upload ceiling · history: {status.persistence ?? 'unknown'}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
