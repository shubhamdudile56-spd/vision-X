import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Accessibility,
  ArrowRight,
  Boxes,
  Camera,
  Cpu,
  FileSearch,
  Gauge,
  HardHat,
  Layers,
  PlayCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Volume2,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useEngine } from '../context/EngineContext.jsx';
import DemoBadge from '../components/DemoBadge.jsx';
import ApiKeyPanel from '../components/ApiKeyPanel.jsx';
import { AnimatedCounter } from '../components/AnalyticsChart.jsx';
import { cx } from '../utils/format.js';
import { ContainerScroll } from '../components/ui/container-scroll-animation.jsx';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Interactive Detection Canvas',
    body: 'Pixel-accurate bounding boxes with class names and confidence percentages, drawn on a HiDPI canvas you can click through.'
  },
  {
    icon: Cpu,
    title: 'Dual Intelligence Engine',
    body: 'Real Gemini v2.5 multimodal inference, or an air-gapped Simulated Demo Mode that labels every result as pre-recorded.'
  },
  {
    icon: Volume2,
    title: 'Accessibility-First Narration',
    body: 'Every scan is narrated through the browser speech engine with 0.5×–2.0× rate control, voice selection, and pause/resume.'
  },
  {
    icon: HardHat,
    title: 'Safety & EHS Compliance',
    body: 'Flags missing helmets and vests, blocked fire exits, and trip hazards, then recommends the action an operator should take.'
  },
  {
    icon: FileSearch,
    title: 'Document & OCR Understanding',
    body: 'Reads equipment serial plates, schematics, and printed form fields, and calls out unsigned or incomplete rows.'
  },
  {
    icon: Layers,
    title: 'Historical Trend Analytics',
    body: 'Severity indices, category breakdowns, and confidence trends are stored per tenant and visualised on the operations dashboard.'
  }
];

const DOMAINS = [
  { label: 'Industrial & Surface Inspection', detail: 'Cracks, corrosion, spalling, alignment', icon: Gauge },
  { label: 'Workplace Safety & EHS', detail: 'PPE compliance, egress, trip hazards', icon: HardHat },
  { label: 'Retail & Inventory', detail: 'Shelf counts, stock gaps, planograms', icon: Boxes },
  { label: 'Document & OCR', detail: 'Serial tags, schematics, forms', icon: FileSearch }
];

const PIPELINE = [
  { step: '01', title: 'Ingest', body: 'WebRTC frame capture or a validated image upload, capped at 10MB.' },
  { step: '02', title: 'Validate', body: 'Server-side Zod schemas plus magic-byte verification of every pixel stream.' },
  { step: '03', title: 'Infer', body: 'Gemini 2.5 multimodal analysis returns strict, schema-bound JSON.' },
  { step: '04', title: 'Score', body: 'Severity index, per-object risk, and recommended actions are recomputed server-side.' },
  { step: '05', title: 'Present', body: 'Bounding canvas, object cards, narration, and an exportable audit record.' }
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { status, loading: engineLoading, error: engineError, engineConfigured, model, persistence } =
    useEngine();
  const heroRef = useRef(null);

  const metrics = useMemo(
    () => [
      { label: 'Objects resolved per frame', value: 25, suffix: '+' },
      { label: 'Vision pipeline stages', value: 5, suffix: '' },
      { label: 'Input ceiling per scan', value: 10, suffix: 'MB' },
      { label: 'Narration rate range', value: 4, suffix: '×' }
    ],
    []
  );

  return (
    <div>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-vision-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div ref={heroRef} className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          {!engineLoading && !engineConfigured && !engineError && (
            <div className="mb-10">
              <ApiKeyPanel />
            </div>
          )}

          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-vision-400/30 bg-vision-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-vision-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Multimodal visual intelligence
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
                See.
                <span className="block bg-gradient-to-r from-vision-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  Understand.
                </span>
                Experience.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                VisionX turns a camera feed or a single photograph into structured operational
                intelligence: detected objects with bounding boxes, a severity index, spoken
                narration, and an audit trail your team can act on.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/live" className="btn-primary !px-5 !py-3">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Start Vision
                </Link>
                <Link to="/upload" className="btn-ghost !px-5 !py-3">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload Image
                </Link>
                <Link to="/upload?mode=demo" className="btn-ghost !px-5 !py-3">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Try Demo
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-vision-400" aria-hidden="true" />
                  API keys stay server-side
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-vision-400" aria-hidden="true" />
                  gemini-2.5-flash multimodal
                </span>
                <span className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-vision-400" aria-hidden="true" />
                  Screen-reader friendly
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="glass relative overflow-hidden rounded-3xl p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-950">
                  <div className="absolute inset-0 grid-lines" aria-hidden="true" />
                  <div
                    className="absolute inset-x-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-vision-400/20 to-transparent"
                    aria-hidden="true"
                  />

                  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <rect x="40" y="50" width="150" height="180" rx="6" fill="none" stroke="#10b981" strokeWidth="2" />
                    <rect x="212" y="86" width="140" height="140" rx="6" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                    <rect x="96" y="150" width="80" height="70" rx="6" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <g fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">
                      <rect x="40" y="28" width="104" height="20" rx="4" fill="rgba(16,185,129,0.9)" />
                      <text x="48" y="42" fill="#04110c">
                        Pump housing 94%
                      </text>
                      <rect x="212" y="64" width="92" height="20" rx="4" fill="rgba(45,212,191,0.9)" />
                      <text x="220" y="78" fill="#04110c">
                        Valve assembly 88%
                      </text>
                      <rect x="96" y="128" width="120" height="20" rx="4" fill="rgba(245,158,11,0.92)" />
                      <text x="104" y="142" fill="#1a1003">
                        Corrosion · risk 0.71
                      </text>
                    </g>
                  </svg>

                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <DemoBadge />
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-ink-950/80 px-2.5 py-1 font-mono text-[10px] text-vision-300">
                    severity 0.412
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 pt-3">
                  {[
                    { label: 'Objects', value: '12' },
                    { label: 'Confidence', value: '91.4%' },
                    { label: 'Severity', value: '0.412' }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong absolute -left-6 -top-6 hidden animate-floaty rounded-2xl px-4 py-3 lg:block">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Streaming</p>
                <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-vision-300">
                  <span className="h-2 w-2 animate-pulseRing rounded-full bg-vision-400" />
                  rear camera · 1280px
                </p>
              </div>
            </div>
          </div>

          {/* Metric counters */}
          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="card !p-4">
                <p className="text-2xl font-extrabold text-white">
                  <AnimatedCounter value={metric.value} />
                  <span className="text-vision-400">{metric.suffix}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Scroll Animation */}
      <section className="relative overflow-hidden bg-[#070a11]">
        <ContainerScroll
          titleComponent={
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400 mb-4">
                Visual Intelligence Platform
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                The inspection canvas
                <span className="block mt-2 bg-gradient-to-r from-vision-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  in full detail
                </span>
              </h2>
              <p className="mt-5 text-base text-slate-400 max-w-2xl mx-auto">
                Pixel-accurate bounding boxes, severity scoring, and spoken narration —
                all streamed from a single Gemini multimodal inference pass.
              </p>
            </>
          }
        >
          {/* Inner card: inspection scene mock-up */}
          <div className="relative w-full h-full bg-[#070a11] rounded-2xl overflow-hidden">
            {/* Camera reticle corners */}
            <div className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-vision-400/60 pointer-events-none z-10" />
            <div className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-vision-400/60 pointer-events-none z-10" />
            <div className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2 border-vision-400/60 pointer-events-none z-10" />
            <div className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2 border-vision-400/60 pointer-events-none z-10" />

            {/* Background inspection image */}
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80"
              alt="VisionX inspection canvas demo"
              className="w-full h-full object-cover opacity-60"
              draggable={false}
            />

            {/* SVG Bounding boxes overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1400 720" preserveAspectRatio="xMidYMid slice">
              {/* Box 1 — Structural */}
              <rect x="420" y="80" width="360" height="280" rx="6" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" />
              <rect x="420" y="50" width="180" height="26" rx="5" fill="rgba(245,158,11,0.9)" />
              <text x="432" y="68" fill="#1a1003" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono, monospace">Wall Crack · HIGH</text>

              {/* Box 2 — Electrical */}
              <rect x="860" y="160" width="280" height="220" rx="6" fill="rgba(244,63,94,0.08)" stroke="#f43f5e" strokeWidth="2.5" />
              <rect x="860" y="130" width="200" height="26" rx="5" fill="rgba(244,63,94,0.9)" />
              <text x="872" y="148" fill="#1a0309" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono, monospace">Wiring Fault · CRITICAL</text>

              {/* Box 3 — Safe zone */}
              <rect x="100" y="350" width="240" height="200" rx="6" fill="rgba(6,182,212,0.07)" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />
              <rect x="100" y="322" width="170" height="24" rx="5" fill="rgba(6,182,212,0.85)" />
              <text x="112" y="338" fill="#01090d" fontSize="12" fontWeight="700" fontFamily="JetBrains Mono, monospace">Furniture · LOW</text>
            </svg>

            {/* Status bar overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#070a11] via-[#070a11]/80 to-transparent px-5 pb-4 pt-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-vision-300">
                    <span className="w-2 h-2 rounded-full bg-vision-400 animate-pulse" />
                    GEMINI VISION ACTIVE
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                  <span><span className="text-amber-400">3</span> ISSUES FOUND</span>
                  <span>SEVERITY <span className="text-rose-400">0.71</span></span>
                  <span>CONF <span className="text-emerald-400">94.2%</span></span>
                </div>
              </div>
            </div>

            {/* Top HUD strip */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-5 pt-4 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                AI STREAM ACTIVE
              </div>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                VISIONX DETECT ENGINE V2.5 · RES: 1080p · FPS: 30
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">Capabilities</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            One pipeline, four operating domains
          </h2>
          <p className="mt-4 text-slate-400">
            VisionX ships with a structured analysis contract — normalised coordinates, confidence,
            risk, and an actionable recommendation for every detection — so downstream tooling never
            has to parse free-form model text.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card group transition hover:border-vision-400/40">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-vision-500/10">
                <Icon className="h-5 w-5 text-vision-400" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Domains */}
      <section className="border-y border-white/10 bg-ink-900/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">
                Target domains
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                Built for the people who sign off on the work
              </h2>
              <p className="mt-4 text-slate-400">
                Every result carries a severity index and a recommended action, so a scan becomes a
                work order rather than a screenshot.
              </p>

              <div className="mt-8 space-y-3">
                {DOMAINS.map(({ label, detail, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-vision-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-vision-400" aria-hidden="true" />
                Multi-stage processing pipeline
              </h3>
              <ol className="mt-5 space-y-4">
                {PIPELINE.map((stage, index) => (
                  <li key={stage.step} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-vision-400/30 bg-vision-500/10 font-mono text-[11px] font-bold text-vision-300">
                        {stage.step}
                      </span>
                      {index < PIPELINE.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-gradient-to-b from-vision-400/40 to-transparent" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-white">{stage.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{stage.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Callout */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass overflow-hidden rounded-3xl p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                {engineError
                  ? 'Bring your own camera'
                  : engineConfigured
                    ? `Real inference is armed on ${model}`
                    : 'Add a Gemini API key to unlock Real Vision AI Mode'}
              </h2>
              <p className="mt-3 max-w-xl text-slate-400">
                {engineError
                  ? 'The VisionX API is not responding right now. Start the server on port 5000, then reload this page.'
                  : engineConfigured
                    ? 'Point the camera at a scene and detections stream back with bounding boxes, risk scores, and narration.'
                    : 'Paste a Google AI Studio key above and the server validates it immediately. Until then VisionX serves Simulated Demo Mode, with every result explicitly tagged so nothing can be mistaken for live inference.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/live" className="btn-primary !px-5 !py-3">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Open Live Vision
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {!isAuthenticated && (
                  <Link to="/auth" className="btn-ghost !px-5 !py-3">
                    Create an inspector account
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-950/60 p-5 font-mono text-[11px] leading-relaxed text-slate-400">
              <p className="text-slate-500"># engine status</p>
              <p className="mt-2">
                <span className="text-slate-500">vision_engine</span>{' '}
                <span className={cx(status?.engine_configured ? 'text-emerald-400' : 'text-amber-400')}>
                  {status?.engine_configured ? 'ONLINE' : 'SIMULATED'}
                </span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">model</span>{' '}
                <span className="text-vision-300">{status?.model ?? 'simulated-dataset'}</span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">database</span>{' '}
                <span className={cx(status?.database_configured ? 'text-emerald-400' : 'text-amber-400')}>
                  {status?.database_configured ? 'CONNECTED' : 'IN-MEMORY'}
                </span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">max_upload</span>{' '}
                <span className="text-vision-300">
                  {status ? `${Math.round(status.limits.max_upload_bytes / 1024 / 1024)}MB` : '10MB'}
                </span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">history</span>{' '}
                <span className="text-vision-300">{persistence ?? '—'}</span>
              </p>
              <p className="mt-1">
                <span className="text-slate-500">demo_scenes</span>{' '}
                <span className="text-vision-300">{status?.demo_scenes?.length ?? '—'}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
