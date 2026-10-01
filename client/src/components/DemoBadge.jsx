/**
 * Explicit, unmissable marker for simulated (DEMO MODE) results.
 * Every non-live asset in the app is tagged with this component so a
 * presentation can never be mistaken for real model inference.
 */
export default function DemoBadge({ label = 'Demo / Simulated Mode', size = 'sm', className = '' }) {
  const sizing =
    size === 'lg'
      ? 'px-3 py-1.5 text-xs'
      : size === 'md'
        ? 'px-2.5 py-1 text-[11px]'
        : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10
                  font-mono font-bold uppercase tracking-wider text-amber-300 ${sizing} ${className}`}
      title="Results are pre-recorded sample data, not live AI inference"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-300" />
      </span>
      [{label}]
    </span>
  );
}
