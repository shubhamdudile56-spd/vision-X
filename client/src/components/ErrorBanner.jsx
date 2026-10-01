import { AlertTriangle, Loader2 } from 'lucide-react';
import { cx } from '../utils/format.js';

/** Inline, dismissible error banner used by every form and analysis surface. */
export default function ErrorBanner({ error, onDismiss, className = '' }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message || 'Something went wrong';
  const details = !Array.isArray(error?.details) ? null : error.details;

  return (
    <div
      role="alert"
      className={cx(
        'flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200',
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{message}</p>
        {details?.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-red-300/80">
            {details.map((item) => (
              <li key={`${item.field}-${item.message}`}>
                <span className="font-mono text-red-200/70">{item.field}</span>: {item.message}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={cx('animate-spin', className)} aria-hidden="true" />;
}

export function LoadingBlock({ label = 'Loading…', className = '' }) {
  return (
    <div className={cx('flex items-center justify-center gap-3 py-16 text-sm text-slate-400', className)}>
      <Spinner className="h-5 w-5 text-vision-400" />
      <span>{label}</span>
    </div>
  );
}
