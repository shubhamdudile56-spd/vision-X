import { ChevronDown, Crosshair, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { categoryColor, cx, formatConfidence, severityMeta } from '../utils/format.js';

const RISK_LABEL = (risk) => {
  const value = Number(risk ?? 0);
  if (value >= 0.7) return 'High';
  if (value >= 0.4) return 'Elevated';
  if (value >= 0.15) return 'Moderate';
  return 'Low';
};

/**
 * A single detected item. Hovering highlights its box on the canvas; clicking
 * expands the deep-dive panel (category, risk, recommended action, coordinates).
 */
export default function ObjectCard({ object, index, isActive, onHover, onSelect, onLeave, mode }) {
  const [expanded, setExpanded] = useState(false);
  if (!object) return null;

  const box = object.bounding_box || {};
  const severity = severityMeta(object.risk_score);
  const color = categoryColor(object.category);

  return (
    <article
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={() => onLeave?.(index)}
      className={cx(
        'group relative overflow-hidden rounded-xl border bg-white/[0.03] transition-all duration-200',
        isActive ? 'border-sky-400/60 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]' : 'border-white/10 hover:border-white/25'
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip" style={{ borderColor: `${color}55`, color }}>
              {object.category || 'General Object'}
            </span>
            <span
              className={cx('chip', severity.bg, severity.text, severity.border)}
              title="Object-level risk score"
            >
              Risk {RISK_LABEL(object.risk_score)} · {Number(object.risk_score ?? 0).toFixed(2)}
            </span>
            {mode === 'DEMO' && (
              <span className="chip !border-amber-400/50 !text-amber-300">SIM</span>
            )}
          </div>

          <h3 className="mt-2 truncate text-sm font-bold text-white" title={object.object_name}>
            {object.object_name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {object.insight || 'No model commentary returned for this detection.'}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 text-sm font-extrabold text-vision-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {formatConfidence(object.confidence)}
          </div>
          <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-vision-400"
              style={{ width: `${Math.min(100, Math.max(0, object.confidence))}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setExpanded((value) => !value);
          onSelect?.(object, index);
        }}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between border-t border-white/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-vision-300"
      >
        <span className="flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
          Box {Math.round(box.x_min)},{Math.round(box.y_min)} → {Math.round(box.x_max)},{Math.round(box.y_max)}
        </span>
        <ChevronDown className={cx('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="animate-fadeUp space-y-3 border-t border-white/10 bg-ink-950/50 px-5 py-4 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-slate-500">Spatial coordinates</p>
            <p className="mt-1 font-mono text-slate-300">
              x: {Number(box.x_min).toFixed(1)}–{Number(box.x_max).toFixed(1)}% · y:{' '}
              {Number(box.y_min).toFixed(1)}–{Number(box.y_max).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-slate-500">Recommended action</p>
            <p className="mt-1 leading-relaxed text-slate-300">
              {object.recommended_action || 'Review manually against the site inspection checklist.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
              <p className="mt-0.5 text-sm font-bold text-vision-300">{formatConfidence(object.confidence)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Risk index</p>
              <p className={cx('mt-0.5 text-sm font-bold', severity.text)}>
                {Number(object.risk_score ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
