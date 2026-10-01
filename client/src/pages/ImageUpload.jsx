import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileImage,
  FileUp,
  ImagePlus,
  ScanSearch,
  Sparkles,
  Trash2,
  Zap
} from 'lucide-react';
import AnalysisPanel from '../components/AnalysisPanel.jsx';
import ApiKeyPanel from '../components/ApiKeyPanel.jsx';
import DemoBadge from '../components/DemoBadge.jsx';
import ErrorBanner, { Spinner } from '../components/ErrorBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEngine } from '../context/EngineContext.jsx';
import { analyzeFile, analyzeImageData, saveScan } from '../utils/api.js';
import { saveLocalScan } from '../utils/localStorage.js';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, fileSchema } from '../utils/validation.js';
import { cx, formatBytes, formatDuration, makeThumbnail } from '../utils/format.js';

const EXAMPLES = [
  { key: 'industrial', label: 'Pump house' },
  { key: 'safety', label: 'Construction site' },
  { key: 'retail', label: 'Retail aisle' },
  { key: 'document', label: 'Nameplate + form' }
];

export default function ImageUpload() {
  const { isAuthenticated } = useAuth();
  const {
    engineConfigured,
    loading: engineLoading,
    refresh: refreshEngine,
  } = useEngine();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [mode, setMode] = useState(searchParams.get('mode') === 'demo' ? 'DEMO' : 'REAL');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [demoScene, setDemoScene] = useState(EXAMPLES[0].key);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Real mode needs a key; without one, the page starts in Demo.
  useEffect(() => {
    if (engineLoading) return;
    if (!engineConfigured && mode === 'REAL') setMode('DEMO');
  }, [engineConfigured, engineLoading, mode]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('mode', mode.toLowerCase());
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Revoke the object URL when it is replaced or the page unmounts.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const acceptFile = useCallback((candidate) => {
    const parsed = fileSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(new Error(parsed.error.issues[0].message));
      return false;
    }
    setError(null);
    setFile(parsed.data);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(parsed.data);
    });
    setAnalysis(null);
    setElapsed(null);
    setSaved(false);
    return true;
  }, []);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setElapsed(null);
    setSaved(false);
    setError(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const runAnalysis = async () => {
    setError(null);
    setSaved(false);
    setAnalyzing(true);
    const startedAt = performance.now();

    try {
      let result;
      if (mode === 'DEMO') {
        // Demo mode ignores the uploaded pixels entirely and returns a labelled
        // simulated payload so an offline presentation stays honest.
        result = await analyzeImageData({
          imageData: 'data:image/png;base64,AAAA',
          mode: 'DEMO',
          sourceType: 'UPLOAD',
          persist: false,
          demoScene
        });
      } else {
        if (!file) throw new Error('Select an image first.');
        result = await analyzeFile(file, { mode: 'REAL', sourceType: 'UPLOAD' });
      }
      setAnalysis(result);
      setElapsed(performance.now() - startedAt);
    } catch (err) {
      setError(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      if (isAuthenticated) {
        if (mode === 'REAL' && file) {
          // Re-submit with persistence enabled so the scan lands in PostgreSQL.
          await analyzeFile(file, { mode: 'REAL', sourceType: 'UPLOAD' });
        } else {
          await saveScan({
            mode: analysis.mode,
            source_type: 'UPLOAD',
            image_url: preview || 'demo_reference',
            scene_category: analysis.scene_category,
            scene_description: analysis.scene_description,
            severity_score: analysis.severity_score,
            detected_objects: (analysis.detected_objects || []).map((obj) => ({
              object_name: obj.object_name,
              category: obj.category,
              confidence: obj.confidence,
              bounding_box: obj.bounding_box,
              insight: obj.insight
            }))
          });
        }
      } else {
        const thumbnail = preview ? await makeThumbnail(preview, 320) : null;
        saveLocalScan(analysis, { sourceType: 'UPLOAD', thumbnail });
      }
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const isDemo = mode === 'DEMO';
  const canAnalyze = isDemo || Boolean(file);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">Analysis hub</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Image &amp; File Analysis</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Drop a photograph, a nameplate, or a printed form. VisionX returns detected objects with
            bounding boxes, a severity index, and a spoken scene description.
          </p>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-ink-950/60 p-1" role="radiogroup" aria-label="Analysis mode">
          {['REAL', 'DEMO'].map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => setMode(option)}
              disabled={option === 'REAL' && !engineConfigured}
              title={option === 'REAL' && !engineConfigured ? 'Add a Gemini API key first' : undefined}
              className={cx(
                'rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40',
                mode === option
                  ? option === 'DEMO'
                    ? 'bg-amber-400 text-ink-950'
                    : 'bg-vision-500 text-ink-950'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {option === 'DEMO' ? 'Demo' : 'Real AI'}
            </button>
          ))}
        </div>
      </header>

      {isDemo && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          <DemoBadge />
          <p className="min-w-0 flex-1">
            Simulated Mode. The uploaded file is not analysed by any model — pick a sample scene
            below and every result is explicitly tagged.
          </p>
          <select
            className="field !w-auto !py-1.5 !text-xs"
            value={demoScene}
            onChange={(event) => setDemoScene(event.target.value)}
            aria-label="Demo scene"
          >
            {EXAMPLES.map((example) => (
              <option key={example.key} value={example.key}>
                {example.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <ErrorBanner className="mt-5" error={error} onDismiss={() => setError(null)} />}

      {!engineConfigured && !engineLoading && (
        <div className="mt-5">
          <ApiKeyPanel
            onConnected={() => {
              refreshEngine();
              setMode('REAL');
            }}
          />
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cx(
              'relative overflow-hidden rounded-2xl border-2 border-dashed transition',
              dragActive
                ? 'border-vision-400 bg-vision-500/10'
                : 'border-white/15 bg-ink-900/50 hover:border-white/30'
            )}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Selected upload preview"
                  className="block max-h-[26rem] w-full bg-ink-950 object-contain"
                />
                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
                  <span className="chip !font-mono !text-slate-200">{file?.name}</span>
                  <span className="chip !font-mono">{formatBytes(file?.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="btn-danger absolute right-3 top-3 !py-1.5 !text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-vision-500/10">
                  <FileUp className="h-6 w-6 text-vision-400" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-white">
                  Drop an image here, or click to browse
                </span>
                <span className="text-xs text-slate-500">
                  PNG, JPEG, or WebP · maximum {formatBytes(MAX_IMAGE_BYTES)} · validated by content,
                  not just extension
                </span>
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) acceptFile(selected);
              }}
            />
          </div>

          <div className="card !p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runAnalysis}
                disabled={!canAnalyze || analyzing}
                className="btn-primary"
              >
                {analyzing ? <Spinner /> : <ScanSearch className="h-4 w-4" aria-hidden="true" />}
                {analyzing ? 'Analysing…' : isDemo ? 'Run demo analysis' : 'Analyze image'}
              </button>

              {!file && !isDemo && (
                <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Choose file
                </button>
              )}

              {file && (
                <button type="button" onClick={reset} className="btn-ghost">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
              )}

              {elapsed !== null && (
                <span className="chip ml-auto !font-mono">{formatDuration(elapsed)}</span>
              )}
            </div>

            {!isDemo && !engineConfigured && (
              <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                No Gemini API key is loaded, so Real mode is unavailable. Add one above, or stay in
                Demo Mode to explore the full interface.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-vision-400" aria-hidden="true" />
              What VisionX looks for
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-400">
              <li>
                <span className="font-semibold text-slate-200">Surface defects</span> — cracks,
                corrosion, spalling, misalignment.
              </li>
              <li>
                <span className="font-semibold text-slate-200">Safety &amp; EHS</span> — missing
                helmets or vests, blocked exits, trip hazards.
              </li>
              <li>
                <span className="font-semibold text-slate-200">General objects</span> — furniture,
                electronics, vehicles, retail inventory.
              </li>
              <li>
                <span className="font-semibold text-slate-200">Document &amp; OCR</span> — serial
                plates, schematics, printed form fields.
              </li>
            </ul>
          </section>

          <section className="card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <FileImage className="h-4 w-4 text-vision-400" aria-hidden="true" />
              Upload rules
            </h2>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
              <li>Accepted: {ACCEPTED_IMAGE_TYPES.join(', ')}</li>
              <li>Maximum size: {formatBytes(MAX_IMAGE_BYTES)}</li>
              <li>Files are held in memory and never written to disk</li>
              <li>MIME declaration must match the real file signature</li>
              <li>Storage: {isAuthenticated ? 'PostgreSQL (account history)' : 'this browser only'}</li>
            </ul>
          </section>

          {!isAuthenticated && (
            <section className="card border-vision-400/30 bg-vision-500/5">
              <h2 className="text-sm font-bold text-white">Keep this scan</h2>
              <p className="mt-2 text-xs text-slate-400">
                Guest scans are stored in local storage. Create an account to move history into
                PostgreSQL and unlock the analytics dashboard.
              </p>
              <Link to="/auth" className="btn-ghost mt-3 w-full !py-2 !text-xs">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                Create an account
              </Link>
            </section>
          )}
        </aside>
      </div>

      {analysis && (
        <div className="mt-8">
          <AnalysisPanel
            analysis={analysis}
            imageSrc={preview}
            sourceType="UPLOAD"
            elapsedMs={elapsed}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
        </div>
      )}

      {!analysis && (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-slate-500">
          {isDemo
            ? 'Run the demo analysis to see the full result surface — boxes, cards, narration, and metrics.'
            : 'Choose an image and run the analysis to see bounding boxes, object cards, and spoken narration.'}
        </div>
      )}
    </div>
  );
}
