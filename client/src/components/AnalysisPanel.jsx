import { useMemo, useState } from 'react';
import {
  Boxes,
  Download,
  Layers,
  Save,
  ScanEye,
  ShieldAlert,
  Sparkles,
  Tag
} from 'lucide-react';
import BoundingCanvas from './BoundingCanvas.jsx';
import ObjectCard from './ObjectCard.jsx';
import AccessibilityPlayer from './AccessibilityPlayer.jsx';
import DemoBadge from './DemoBadge.jsx';
import { SeverityGauge, MetricCard } from './AnalyticsChart.jsx';
import { Spinner } from './ErrorBanner.jsx';
import { downloadJson } from '../utils/localStorage.js';
import { buildNarration, cx, formatDuration } from '../utils/format.js';

/**
 * Shared analysis surface used by both the live camera page and the upload hub:
 * bounding-box canvas, derived metrics, narration, and the interactive object
 * inspector grid.
 */
export default function AnalysisPanel({
  analysis,
  imageSrc,
  sourceType = 'UPLOAD',
  elapsedMs = null,
  onSave,
  saving = false,
  saved = false,
  saveDisabled = false,
  onHoverObject,
  onSelectObject,
  showLabels = true
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [localHover, setLocalHover] = useState(null);

  const narration = useMemo(() => buildNarration(analysis), [analysis]);

  if (!analysis) return null;

  const objects = analysis.detected_objects ?? [];
  const activeObject = localHover ?? (activeIndex !== null ? objects[activeIndex] : null);
  const isDemo = analysis.mode === 'DEMO' || analysis.is_simulated === true;

  const handleHover = (index) => {
    setLocalHover(index);
    onHoverObject?.(index, objects[index]);
  };

  const handleLeave = (index) => {
    setLocalHover((current) => (current === index ? null : current));
    onHoverObject?.(null, null);
  };

  const handleSelect = (object, index) => {
    setActiveIndex((current) => (current === index ? null : index));
    onSelectObject?.(object, index);
  };

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      source: 'VisionX — Smart Visual Experience',
      mode: analysis.mode,
      is_simulated: isDemo,
      model: analysis.model ?? null,
      scene_category: analysis.scene_category,
      scene_description: analysis.scene_description,
      summary: analysis.summary,
      severity_score: analysis.severity_score,
      total_objects: analysis.total_objects ?? objects.length,
      highest_confidence: analysis.highest_confidence ?? 0,
      detected_objects: objects
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(`visionx-scan-${stamp}`, payload);
  };

  return (
    <div className="space-y-5">
      {isDemo && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          <DemoBadge />
          <p className="min-w-0 flex-1">
            {analysis.demo_notice ||
              '[DEMO / SIMULATED MODE] Pre-recorded sample results. Not produced by a live model.'}
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <BoundingCanvas
            imageSrc={imageSrc}
            detectedObjects={objects}
            activeObject={activeObject}
            onSelectObject={handleSelect}
            showLabels={showLabels}
          />

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip !border-vision-400/40 !text-vision-300">
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {analysis.scene_category}
                </span>
                <span className="chip">
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  {sourceType === 'CAMERA' ? 'Live camera frame' : 'Uploaded image'}
                </span>
                {elapsedMs !== null && <span className="chip">{formatDuration(elapsedMs)}</span>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={exportJson} className="btn-ghost !py-1.5 !text-xs">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!onSave || saving || saved || saveDisabled}
                  className={cx('!py-1.5 !text-xs', saved ? 'btn-ghost' : 'btn-primary')}
                >
                  {saving ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : saved ? (
                    <ScanEye className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saved ? 'Saved to history' : saving ? 'Saving…' : 'Save scan'}
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{analysis.scene_description}</p>
            {analysis.summary && (
              <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-vision-300">Operator summary · </span>
                {analysis.summary}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="card">
            <h3 className="text-sm font-bold text-white">Detection metrics</h3>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row xl:flex-col">
              <SeverityGauge score={analysis.severity_score} />
              <div className="grid w-full flex-1 grid-cols-2 gap-3">
                <MetricCard
                  icon={Boxes}
                  label="Objects"
                  value={analysis.total_objects ?? objects.length}
                  tone="teal"
                />
                <MetricCard
                  icon={Sparkles}
                  label="Top confidence"
                  value={Number(analysis.highest_confidence ?? 0).toFixed(1)}
                  suffix="%"
                  decimals={1}
                  tone="blue"
                />
                <MetricCard
                  icon={Layers}
                  label="Categories"
                  value={analysis.unique_categories?.length ?? new Set(objects.map((o) => o.category)).size}
                />
                <MetricCard
                  icon={ShieldAlert}
                  label="Severity"
                  value={Number(analysis.severity_score ?? 0).toFixed(3)}
                  decimals={3}
                  tone={Number(analysis.severity_score ?? 0) >= 0.7 ? 'red' : 'amber'}
                />
              </div>
            </div>
          </section>

          <AccessibilityPlayer text={narration} title="Scene narration" />
        </div>
      </div>

      <section className="card">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <ScanEye className="h-4 w-4 text-vision-400" aria-hidden="true" />
            Object inspector
            <span className="chip">{objects.length} detected</span>
          </h3>
          <p className="text-xs text-slate-500">Hover a card to highlight its box · click to expand</p>
        </header>

        {objects.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
            No objects were detected with sufficient confidence in this frame.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {objects.map((object, index) => (
              <ObjectCard
                key={`${object.object_name}-${index}`}
                object={object}
                index={index}
                isActive={activeObject?.object_name === object.object_name}
                mode={analysis.mode}
                onHover={handleHover}
                onLeave={handleLeave}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
