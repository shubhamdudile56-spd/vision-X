import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  CameraOff,
  Gauge,
  RefreshCw,
  ScanLine,
  Settings2,
  Square,
  SwitchCamera,
  Trash2,
  Zap
} from 'lucide-react';
import AnalysisPanel from '../components/AnalysisPanel.jsx';
import ApiKeyPanel from '../components/ApiKeyPanel.jsx';
import DemoBadge from '../components/DemoBadge.jsx';
import ErrorBanner, { Spinner } from '../components/ErrorBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEngine } from '../context/EngineContext.jsx';
import { analyzeImageData } from '../utils/api.js';
import { saveLocalScan } from '../utils/localStorage.js';
import { cx, frameToDataUrl, formatDuration, makeThumbnail, severityMeta } from '../utils/format.js';

const THROTTLE_OPTIONS = [
  { label: 'Manual only', value: 0 },
  { label: '1 fps', value: 1000 },
  { label: '0.5 fps', value: 2000 },
  { label: '0.25 fps', value: 4000 }
];

export default function LiveVision() {
  const { isAuthenticated } = useAuth();
  const {
    engineConfigured,
    model: engineModel,
    loading: engineLoading,
    refresh: refreshEngine
  } = useEngine();
  const [searchParams, setSearchParams] = useSearchParams();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastFrameRef = useRef(null);

  const [cameraState, setCameraState] = useState('idle'); // idle | starting | live | error | denied
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [mode, setMode] = useState(searchParams.get('mode') === 'demo' ? 'DEMO' : 'REAL');
  const [throttle, setThrottle] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [frameSrc, setFrameSrc] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Real mode is impossible without a key, so fall back to Demo and say why.
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

  // ------------------------------------------------------------------- camera
  const stopStream = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((device) => device.kind === 'videoinput'));
    } catch {
      setDevices([]);
    }
  }, []);

  const startCamera = useCallback(
    async (preferredDeviceId) => {
      stopStream();
      setCameraState('starting');
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setCameraError('This browser does not support camera capture (navigator.mediaDevices is unavailable).');
        return;
      }
      // getUserMedia requires a secure context.
      if (!window.isSecureContext) {
        setCameraState('error');
        setCameraError('Camera access requires HTTPS or localhost. Serve the app over a secure context.');
        return;
      }

      const constraints = {
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const activeId = track?.getSettings?.().deviceId;
        if (activeId) setDeviceId(activeId);
        setCameraState('live');
        refreshDevices();
      } catch (err) {
        setCameraState('denied');
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          setCameraError(
            'Camera permission was denied. Allow camera access in your browser settings, then press Retry.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          setCameraError('No matching camera was found on this device.');
        } else if (err.name === 'NotReadableError') {
          setCameraError('The camera is already in use by another application.');
        } else {
          setCameraError(err.message || 'Could not start the camera.');
        }
        refreshDevices();
      }
    },
    [stopStream, refreshDevices]
  );

  useEffect(() => () => stopStream(), [stopStream]);

  // Re-acquire the stream when the selected device changes.
  const handleDeviceChange = (event) => {
    setDeviceId(event.target.value);
    if (cameraState === 'live') startCamera(event.target.value);
  };

  // ------------------------------------------------------------------ analysis
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      return frameToDataUrl(video, { maxWidth: 1280, quality: 0.85 });
    } catch {
      return null;
    }
  }, []);

  const runAnalysis = useCallback(
    async ({ auto = false } = {}) => {
      if (inFlightRef.current) return;
      if (mode === 'REAL' && cameraState !== 'live') {
        if (!auto) {
          setError(new Error('Start the camera before capturing a frame, or switch to Demo Mode.'));
        }
        return;
      }

      const dataUrl = mode === 'REAL' ? captureFrame() : 'data:image/png;base64,AAAA';
      if (!dataUrl) {
        if (!auto) setError(new Error('Could not read a frame from the video stream.'));
        return;
      }

      inFlightRef.current = true;
      setAnalyzing(true);
      setError(null);
      setSaved(false);
      const startedAt = performance.now();
      lastFrameRef.current = dataUrl;

      try {
        const result = await analyzeImageData({
          imageData: dataUrl,
          mode,
          sourceType: 'CAMERA',
          persist: false
        });
        setAnalysis(result);
        setFrameSrc(dataUrl);
        setElapsed(performance.now() - startedAt);
      } catch (err) {
        if (!auto) setError(err);
      } finally {
        inFlightRef.current = false;
        setAnalyzing(false);
      }
    },
    [mode, cameraState, captureFrame]
  );

  // Frame throttle: repeat analysis on an interval while the camera is live.
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (throttle > 0 && cameraState === 'live' && !inFlightRef.current) {
      timerRef.current = window.setInterval(() => runAnalysis({ auto: true }), throttle);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [throttle, cameraState, runAnalysis]);

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      if (isAuthenticated) {
        // Signed-in scans are written server-side during analysis; ask the API
        // to persist this frame explicitly so the local capture is captured too.
        await analyzeImageData({
          imageData: lastFrameRef.current,
          mode,
          sourceType: 'CAMERA',
          persist: true
        });
      } else {
        const thumbnail = lastFrameRef.current ? await makeThumbnail(lastFrameRef.current, 320) : null;
        saveLocalScan(analysis, { sourceType: 'CAMERA', thumbnail });
      }
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const severity = severityMeta(analysis?.severity_score ?? 0);
  const isDemo = mode === 'DEMO';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vision-400">Live feed</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Live Vision Inspector</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Point the camera at a scene and capture frames for bounding-box detection, severity
            scoring, and spoken narration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </header>

      {isDemo && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          <DemoBadge />
          <p>Simulated Mode returns pre-recorded results. No camera frames are sent to any model.</p>
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

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ------------------------------------------------------- Viewport */}
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={cx(
                'block aspect-video w-full bg-ink-950 object-cover',
                cameraState === 'live' ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Live overlay for the most recent result */}
            {analysis && frameSrc && (
              <div className="pointer-events-none absolute inset-0">
                <LiveOverlay analysis={analysis} showLabels={showLabels} sourceRef={videoRef} />
              </div>
            )}

            {cameraState !== 'live' && (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
                    {cameraState === 'starting' ? (
                      <Spinner className="h-6 w-6 text-vision-400" />
                    ) : (
                      <CameraOff className="h-6 w-6 text-slate-400" />
                    )}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-white">
                    {cameraState === 'starting'
                      ? 'Requesting camera access…'
                      : cameraState === 'denied'
                        ? 'Camera unavailable'
                        : 'Camera is off'}
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500">
                    {cameraError ||
                      'Grant camera permission to stream frames. Demo Mode works without a camera.'}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(deviceId)}
                      className="btn-primary"
                      disabled={cameraState === 'starting'}
                    >
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {cameraState === 'denied' ? 'Retry camera' : 'Start camera'}
                    </button>
                    <button type="button" onClick={() => runAnalysis()} className="btn-ghost">
                      <Zap className="h-4 w-4" aria-hidden="true" />
                      Run {isDemo ? 'demo' : 'a capture'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* HUD */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  'chip !font-mono',
                  cameraState === 'live'
                    ? '!border-emerald-400/50 !bg-emerald-500/15 !text-emerald-300'
                    : '!border-white/15 !text-slate-400'
                )}
              >
                <span
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    cameraState === 'live' ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'
                  )}
                />
                {cameraState === 'live' ? 'REC' : 'IDLE'}
              </span>
              {analysis && (
                <span className={cx('chip !font-mono', severity.bg, severity.text, severity.border)}>
                  severity {Number(analysis.severity_score ?? 0).toFixed(3)}
                </span>
              )}
            </div>

            {cameraState === 'live' && (
              <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] text-vision-300/90">
                {videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="card !p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => runAnalysis()}
                disabled={analyzing}
                className="btn-primary"
              >
                {analyzing ? <Spinner /> : <ScanLine className="h-4 w-4" aria-hidden="true" />}
                {analyzing ? 'Analysing…' : 'Capture frame'}
              </button>

              {cameraState === 'live' ? (
                <button type="button" onClick={stopStream} className="btn-ghost">
                  <Square className="h-4 w-4" aria-hidden="true" />
                  Stop camera
                </button>
              ) : (
                <button type="button" onClick={() => startCamera(deviceId)} className="btn-ghost">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Start camera
                </button>
              )}

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const index = devices.findIndex((device) => device.deviceId === deviceId);
                    const next = devices[(index + 1) % devices.length];
                    setDeviceId(next.deviceId);
                    if (cameraState === 'live') startCamera(next.deviceId);
                  }}
                  className="btn-ghost"
                  title="Switch between available cameras"
                >
                  <SwitchCamera className="h-4 w-4" aria-hidden="true" />
                  Flip camera
                </button>
              )}

              {analysis && (
                <button
                  type="button"
                  onClick={() => {
                    setAnalysis(null);
                    setFrameSrc(null);
                    setElapsed(null);
                    setSaved(false);
                  }}
                  className="btn-ghost"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
              )}

              {elapsed !== null && (
                <span className="chip ml-auto !font-mono">{formatDuration(elapsed)}</span>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
              <div>
                <label htmlFor="throttle" className="label flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                  Frame throttle
                </label>
                <select
                  id="throttle"
                  className="field"
                  value={throttle}
                  onChange={(event) => setThrottle(Number(event.target.value))}
                >
                  {THROTTLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="device" className="label flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Camera device
                </label>
                <select
                  id="device"
                  className="field"
                  value={deviceId}
                  onChange={handleDeviceChange}
                  disabled={devices.length === 0}
                >
                  {devices.length === 0 && <option value="">No devices detected</option>}
                  {devices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-ink-900 accent-vision-500"
                    checked={showLabels}
                    onChange={(event) => setShowLabels(event.target.checked)}
                  />
                  Show box labels
                </label>
                <button
                  type="button"
                  onClick={refreshDevices}
                  className="btn-ghost !px-2.5 !py-1.5"
                  title="Rescan for cameras"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ Side panel */}
        <aside className="space-y-4">
          <section className="card">
            <h2 className="text-sm font-bold text-white">Engine</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Mode</dt>
                <dd className={cx('font-semibold', isDemo ? 'text-amber-300' : 'text-vision-300')}>
                  {isDemo ? 'Simulated' : 'Real Vision AI'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Model</dt>
                <dd className="font-mono text-slate-300">
                  {isDemo ? 'simulated-dataset' : engineModel ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Source</dt>
                <dd className="text-slate-300">WebRTC video track</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Storage</dt>
                <dd className="text-slate-300">{isAuthenticated ? 'PostgreSQL' : 'Browser only'}</dd>
              </div>
            </dl>

            {mode === 'REAL' && !engineConfigured && (
              <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
                No Gemini API key is loaded, so Real mode was disabled. Add one above to switch this
                page to live inference.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="text-sm font-bold text-white">Tips</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
              <li>Hold the subject 1–2 m from the lens for the most reliable boxes.</li>
              <li>Use Manual throttle for single captures; 0.25 fps is enough for a walkthrough.</li>
              <li>
                Captured frames are downscaled to 1280px wide JPEG before leaving the browser, so
                uploads stay well under the 10MB ceiling.
              </li>
              <li>Guest scans save to this browser; sign in to write them to PostgreSQL.</li>
            </ul>
          </section>
        </aside>
      </div>

      {analysis && (
        <div className="mt-8">
          <AnalysisPanel
            analysis={analysis}
            imageSrc={frameSrc}
            sourceType="CAMERA"
            elapsedMs={elapsed}
            showLabels={showLabels}
            onSave={handleSave}
            saving={saving}
            saved={saved}
            saveDisabled={cameraState !== 'live' && mode === 'REAL'}
          />
        </div>
      )}

      {!analysis && cameraState === 'live' && (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-slate-500">
          Capture a frame to generate bounding boxes, a severity index, and spoken narration.
        </div>
      )}

      {!analysis && cameraState !== 'live' && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <p className="w-full text-sm text-slate-500">
            No camera? Run the Simulated Demo pipeline, or analyze a still image instead.
          </p>
          <button type="button" onClick={() => setMode('DEMO')} className="btn-ghost">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Run Demo Analysis
          </button>
        </div>
      )}
    </div>
  );
}

/** Lightweight overlay that tracks the video element with a second canvas. */
function LiveOverlay({ analysis, showLabels, sourceRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const source = sourceRef?.current;
      if (!canvas || !source) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const rect = source.getBoundingClientRect();
      if (rect.width && rect.height) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        const objects = analysis.detected_objects || [];
        objects.forEach((obj) => {
          const box = obj.bounding_box;
          if (!box) return;
          const x = (box.x_min / 100) * rect.width;
          const y = (box.y_min / 100) * rect.height;
          const w = Math.max(((box.x_max - box.x_min) / 100) * rect.width, 8);
          const h = Math.max(((box.y_max - box.y_min) / 100) * rect.height, 8);
          const color = (obj.risk_score ?? 0) >= 0.7 ? '#ef4444' : '#2dd4bf';

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          if (showLabels) {
            const label = `${obj.object_name} ${Math.round(obj.confidence)}%`;
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            const textWidth = ctx.measureText(label).width;
            const labelY = y - 20 > 0 ? y - 20 : y;
            ctx.fillStyle = 'rgba(5,7,13,0.8)';
            ctx.fillRect(x, labelY, textWidth + 10, 18);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, labelY, textWidth + 10, 18);
            ctx.fillStyle = '#e2e8f0';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + 5, labelY + 9);
          }
        });
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [analysis, showLabels, sourceRef]);

  return <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full" aria-hidden="true" />;
}
