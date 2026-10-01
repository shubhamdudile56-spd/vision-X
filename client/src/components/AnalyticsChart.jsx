import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { cx, severityMeta } from '../utils/format.js';

/** Counts up to `value` when it enters the viewport. */
export function AnimatedCounter({ value = 0, duration = 900, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const target = Number(value) || 0;
    let frame = 0;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        // easeOutCubic
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(target * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    let observer = null;
    if (typeof IntersectionObserver === 'undefined') {
      run();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            run();
            observer.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      observer.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function MetricCard({ icon: Icon, label, value, suffix = '', decimals = 0, hint, tone = 'default' }) {
  const tones = {
    default: 'border-white/10 bg-white/[0.03]',
    teal: 'border-vision-400/30 bg-vision-500/10',
    amber: 'border-amber-400/30 bg-amber-500/10',
    red: 'border-red-400/30 bg-red-500/10',
    blue: 'border-sky-400/30 bg-sky-500/10'
  };

  return (
    <div className={cx('rounded-2xl border p-5', tones[tone] ?? tones.default)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            <AnimatedCounter value={value} decimals={decimals} />
            {suffix && <span className="ml-1 text-lg font-bold text-slate-400">{suffix}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
            <Icon className="h-4 w-4 text-vision-400" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}

/** Radial severity gauge with a band label. */
export function SeverityGauge({ score = 0, size = 168, label = 'Structural severity index' }) {
  const meta = severityMeta(score);
  const clamped = Math.min(1, Math.max(0, Number(score) || 0));
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label}: ${clamped.toFixed(3)}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="12" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={meta.hex}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-extrabold text-white">{clamped.toFixed(3)}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">index</p>
          </div>
        </div>
      </div>
      <span className={cx('chip', meta.bg, meta.text, meta.border)}>{meta.label}</span>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

/** Compact trend line + bar chart used on the dashboard. */
export function TrendChart({ data = [], height = 200, showBars = true }) {
  const [hover, setHover] = useState(null);

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        No trend data yet — run a few scans to populate the timeline.
      </div>
    );
  }

  const width = 640;
  const padding = { top: 16, right: 16, bottom: 28, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((point, index) => {
    const x = padding.left + index * step;
    const y = padding.top + innerH * (1 - Math.min(1, Math.max(0, point.avg_severity ?? 0)));
    return { x, y, ...point };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + innerH} L ${points[0].x.toFixed(1)} ${padding.top + innerH} Z`;

  const maxScans = Math.max(...data.map((point) => point.scans ?? 0), 1);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Severity trend over time">
        <defs>
          <linearGradient id="severityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerH * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(148,163,184,0.12)" />
              <text x={4} y={y + 4} fill="#64748b" fontSize="10">
                {ratio.toFixed(2)}
              </text>
            </g>
          );
        })}

        {showBars &&
          data.map((point, index) => {
            const x = padding.left + index * step - step / 6;
            const barH = ((point.scans ?? 0) / maxScans) * (innerH * 0.35);
            return (
              <rect
                key={`bar-${point.bucket}-${index}`}
                x={x}
                y={padding.top + innerH - barH}
                width={Math.max(4, step / 3)}
                height={barH}
                rx={3}
                fill="rgba(148,163,184,0.18)"
              />
            );
          })}

        <path d={areaPath} fill="url(#severityFill)" />
        <path d={linePath} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((point, index) => (
          <g key={`pt-${point.bucket}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hover === index ? 6 : 4}
              fill="#05070d"
              stroke="#2dd4bf"
              strokeWidth="2.5"
            />
            <rect
              x={point.x - step / 2}
              y={padding.top}
              width={Math.max(step, 12)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
            {(index === 0 || index === points.length - 1 || points.length <= 7) && (
              <text x={point.x} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle">
                {point.bucket?.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {hover !== null && points[hover] && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-white/10 bg-ink-900/95 px-3 py-2 text-xs shadow-xl">
          <p className="font-semibold text-white">{points[hover].bucket}</p>
          <p className="mt-0.5 text-slate-400">
            Severity {Number(points[hover].avg_severity ?? 0).toFixed(3)} · Confidence{' '}
            {Number(points[hover].avg_confidence ?? 0).toFixed(1)}%
          </p>
          <p className="text-slate-500">
            {points[hover].scans} scan{points[hover].scans === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}

/** Horizontal bar breakdown of detections by category. */
export function CategoryBars({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
        No category data yet.
      </div>
    );
  }

  const max = Math.max(...data.map((row) => row.occurrences ?? 0), 1);
  const palette = ['#2dd4bf', '#f59e0b', '#f43f5e', '#38bdf8', '#a855f7', '#94a3b8'];

  return (
    <ul className="space-y-3">
      {data.map((row, index) => (
        <li key={row.category}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">{row.category}</span>
            <span className="font-mono text-slate-400">
              {row.occurrences} · {Number(row.avg_confidence ?? 0).toFixed(1)}% avg
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(4, ((row.occurrences ?? 0) / max) * 100)}%`,
                backgroundColor: palette[index % palette.length]
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsChart({ data = [], categoryData = [] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="card lg:col-span-2">
        <header className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <TrendingUp className="h-4 w-4 text-vision-400" aria-hidden="true" />
            Historical severity trend
          </h3>
          <span className="chip">Last 14 days</span>
        </header>
        <div className="mt-4">
          <TrendChart data={data} />
        </div>
      </section>

      <section className="card">
        <h3 className="text-sm font-bold text-white">Category breakdown</h3>
        <div className="mt-4">
          <CategoryBars data={categoryData} />
        </div>
      </section>
    </div>
  );
}
