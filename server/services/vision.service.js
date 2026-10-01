/**
 * Vision analysis orchestration and result normalisation.
 *
 * Model output is treated as untrusted: every field is clamped to its valid
 * range, degenerate boxes are repaired, and derived metrics are recomputed
 * server-side rather than trusted from the model.
 */
import config from '../config/env.js';
import { analyzeImage, isGeminiConfigured } from './gemini.service.js';
import { buildDemoResponse } from './demo.service.js';

const CATEGORY_ALIASES = [
  { match: /safety|ehs|ppe|helmet|hazard|exit|trip|injur/i, value: 'Safety & EHS' },
  { match: /industrial|pipe|valve|motor|machiner|equipment|pump|structur|scaffold/i, value: 'Industrial Inspection' },
  { match: /document|ocr|text|label|tag|schematic|form|serial|print/i, value: 'Document & OCR' },
  { match: /crack|corrosion|spall|defect|damage|rust|wear/i, value: 'Surface Defect' }
];

export const DEFAULT_CATEGORY = 'General Object';

export function normaliseCategory(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return DEFAULT_CATEGORY;
  const hit = CATEGORY_ALIASES.find((entry) => entry.match.test(value));
  return hit ? hit.value : value.slice(0, 100);
}

const clamp = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

const clean = (value, maxLength, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : fallback;
};

/** Clamps a raw 0-1 model ratio to the 0-100 confidence scale (and vice versa). */
function normaliseConfidence(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return 0;
  if (num >= 0 && num <= 1) return Math.round(num * 1000) / 10;
  return Math.round(clamp(num, 0, 100, 0) * 10) / 10;
}

function normaliseRisk(raw, confidence) {
  const num = Number(raw);
  if (Number.isFinite(num)) {
    if (num > 1 && num <= 100) return Math.round((num / 100) * 1000) / 1000;
    return Math.round(clamp(num, 0, 1, 0) * 1000) / 1000;
  }
  // Derive a conservative proxy from confidence when the model omits risk.
  return Math.round(clamp(1 - confidence / 100, 0.05, 0.9, 0.3) * 1000) / 1000;
}

function normaliseBox(raw) {
  const box = raw && typeof raw === 'object' ? raw : {};
  let xMin = clamp(box.x_min ?? box.xMin ?? 0, 0, 100, 0);
  let yMin = clamp(box.y_min ?? box.yMin ?? 0, 0, 100, 0);
  let xMax = clamp(box.x_max ?? box.xMax ?? 0, 0, 100, 0);
  let yMax = clamp(box.y_max ?? box.yMax ?? 0, 0, 100, 0);

  if (xMax < xMin) [xMin, xMax] = [xMax, xMin];
  if (yMax < yMin) [yMin, yMax] = [yMax, yMin];

  // Reject degenerate boxes: give a minimal 4% box so the overlay stays usable.
  if (xMax - xMin < 2) {
    xMin = clamp(xMin, 0, 96, 0);
    xMax = xMin + 4;
  }
  if (yMax - yMin < 2) {
    yMin = clamp(yMin, 0, 96, 0);
    yMax = yMin + 4;
  }

  return {
    x_min: Math.round(xMin * 10) / 10,
    y_min: Math.round(yMin * 10) / 10,
    x_max: Math.round(xMax * 10) / 10,
    y_max: Math.round(yMax * 10) / 10
  };
}

export function severityBand(score) {
  if (score >= 0.7) return { level: 'critical', label: 'Critical', color: '#ef4444' };
  if (score >= 0.4) return { level: 'elevated', label: 'Elevated', color: '#f59e0b' };
  if (score >= 0.15) return { level: 'moderate', label: 'Moderate', color: '#eab308' };
  return { level: 'nominal', label: 'Nominal', color: '#10b981' };
}

/**
 * Structural severity index.
 *
 * severity = 0.55 * (risk-weighted coverage) + 0.45 * (peak risk)
 * Coverage is the risk-weighted fraction of the frame occupied by findings, so
 * both a single critical defect and many minor ones move the index.
 */
export function computeSeverity(objects, modelSeverity) {
  const peakRisk = objects.reduce((max, obj) => Math.max(max, obj.risk_score), 0);

  const coverage = objects.reduce((sum, obj) => {
    const { x_min, y_min, x_max, y_max } = obj.bounding_box;
    const area = Math.max(0, ((x_max - x_min) / 100) * ((y_max - y_min) / 100));
    return sum + area * obj.risk_score * (obj.confidence / 100);
  }, 0);

  const derived = 0.55 * clamp(coverage, 0, 1) + 0.45 * clamp(peakRisk, 0, 1);
  const reported = clamp(modelSeverity, 0, 1, derived);
  // Blend the model's judgement with the geometric derivation for stability.
  const blended = 0.65 * reported + 0.35 * derived;

  return Math.round(clamp(blended, 0, 1, 0) * 1000) / 1000;
}

export function normaliseVisionResult(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawObjects = Array.isArray(source.detected_objects) ? source.detected_objects.slice(0, 25) : [];

  const detectedObjects = rawObjects
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const confidence = normaliseConfidence(item.confidence);
      const name = clean(item.object_name ?? item.name, 100, 'Unidentified Object');
      return {
        object_name: name,
        category: normaliseCategory(item.category),
        confidence,
        risk_score: normaliseRisk(item.risk_score, confidence),
        recommended_action: clean(
          item.recommended_action,
          600,
          'Review manually against the site inspection checklist.'
        ),
        bounding_box: normaliseBox(item.bounding_box ?? item.box),
        insight: clean(
          item.insight,
          2000,
          'No additional model commentary was returned for this item.'
        )
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const severityScore = computeSeverity(detectedObjects, source.severity_score);

  return {
    scene_category: clean(source.scene_category, 100, 'Uncategorised Scene'),
    scene_description: clean(
      source.scene_description,
      4000,
      'No scene description was returned by the vision engine.'
    ),
    summary: clean(
      source.summary,
      2000,
      detectedObjects.length
        ? `${detectedObjects.length} object(s) detected. Overall severity ${severityScore.toFixed(3)}.`
        : 'No objects were detected with sufficient confidence in this frame.'
    ),
    severity_score: severityScore,
    severity_band: severityBand(severityScore),
    detected_objects: detectedObjects,
    total_objects: detectedObjects.length,
    unique_categories: [...new Set(detectedObjects.map((obj) => obj.category))],
    highest_confidence:
      detectedObjects.length > 0 ? Math.max(...detectedObjects.map((obj) => obj.confidence)) : 0
  };
}

/**
 * Entry point used by the vision route.
 * @param {{buffer: Buffer, mimeType: string, mode: 'REAL'|'DEMO', sceneKey?: string}} params
 */
export async function runVisionAnalysis({ buffer, mimeType, mode, sceneKey }) {
  if (mode === 'DEMO') {
    return buildDemoResponse(sceneKey);
  }

  const { payload, model } = await analyzeImage(buffer, mimeType);
  const normalised = normaliseVisionResult(payload);

  return {
    scan_id: null,
    mode: 'REAL',
    is_simulated: false,
    demo_notice: null,
    analyzed_at: new Date().toISOString(),
    model: model || config.geminiModel,
    ...normalised
  };
}

export { isGeminiConfigured };
export default { runVisionAnalysis, normaliseVisionResult, computeSeverity, severityBand };
