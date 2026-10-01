/** Formatting and image helpers shared across the UI. */

export const SEVERITY_META = {
  critical: { label: 'Critical', text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40', hex: '#ef4444' },
  elevated: { label: 'Elevated', text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', hex: '#f59e0b' },
  moderate: { label: 'Moderate', text: 'text-yellow-300', bg: 'bg-yellow-400/15', border: 'border-yellow-400/40', hex: '#eab308' },
  nominal: { label: 'Nominal', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', hex: '#10b981' }
};

export const CATEGORY_META = {
  'Safety & EHS': { hex: '#f43f5e', icon: 'shield' },
  'Industrial Inspection': { hex: '#f59e0b', icon: 'factory' },
  'Surface Defect': { hex: '#a855f7', icon: 'crack' },
  'Document & OCR': { hex: '#38bdf8', icon: 'file' },
  'General Object': { hex: '#2dd4bf', icon: 'box' }
};

export function severityMeta(score) {
  const value = Number(score ?? 0);
  if (value >= 0.7) return SEVERITY_META.critical;
  if (value >= 0.4) return SEVERITY_META.elevated;
  if (value >= 0.15) return SEVERITY_META.moderate;
  return SEVERITY_META.nominal;
}

export function categoryColor(category) {
  return CATEGORY_META[category]?.hex ?? '#94a3b8';
}

export function formatConfidence(value) {
  const num = Number(value ?? 0);
  return `${num >= 10 ? Math.round(num) : num.toFixed(1)}%`;
}

export function formatSeverity(score) {
  return Number(score ?? 0).toFixed(3);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatBytes(bytes) {
  const num = Number(bytes ?? 0);
  if (!num) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(num) / Math.log(1024)));
  return `${(num / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** File → data URL. Rejects unsupported types and oversized files. */
export function fileToDataUrl(file, { maxBytes = 10 * 1024 * 1024, allowed = ['image/png', 'image/jpeg', 'image/webp'] } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected'));
    if (!allowed.includes(file.type)) {
      return reject(new Error(`Unsupported file type "${file.type || 'unknown'}". Allowed: PNG, JPEG, WebP.`));
    }
    if (file.size > maxBytes) {
      return reject(new Error(`File is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`));
    }
    if (file.size < 64) {
      return reject(new Error('That image looks empty or truncated.'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:image/')) {
        return reject(new Error('Could not read the image as a data URL.'));
      }
      return resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

/** Draws a video frame (or an image) onto a canvas and returns a JPEG data URL. */
export function frameToDataUrl(source, { width, quality = 0.85, maxWidth = 1280 } = {}) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) throw new Error('Source has no readable dimensions yet');

  const targetWidth = Math.min(width || maxWidth, sourceWidth);
  const targetHeight = Math.round((sourceHeight / sourceWidth) * targetWidth);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable in this browser');
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Small offscreen thumbnail used for history cards. */
export function makeThumbnail(dataUrl, size = 320) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const ratio = image.width / image.height || 1;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = Math.round(size / ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** Builds a plain-language narration script from an analysis result. */
export function buildNarration(analysis) {
  if (!analysis) return '';
  const parts = [];
  const category = analysis.scene_category || 'an unspecified scene';
  parts.push(`Scene classification: ${category}.`);

  if (analysis.scene_description) {
    parts.push(analysis.scene_description);
  }

  const objects = analysis.detected_objects || [];
  if (objects.length === 0) {
    parts.push('No objects were detected with sufficient confidence in this frame.');
  } else {
    parts.push(`${objects.length} object${objects.length === 1 ? '' : 's'} detected.`);
    objects.slice(0, 8).forEach((obj, index) => {
      const { x_min, y_min, x_max, y_max } = obj.bounding_box || {};
      const position = `positioned at ${Math.round(x_min)} to ${Math.round(x_max)} percent horizontally and ${Math.round(y_min)} to ${Math.round(y_max)} percent vertically`;
      parts.push(
        `Item ${index + 1}: ${obj.object_name}, category ${obj.category}, confidence ${Math.round(obj.confidence)} percent, ${position}. ${obj.insight || ''}`.trim()
      );
    });
    if (objects.length > 8) {
      parts.push(`${objects.length - 8} further detections are listed in the object panel.`);
    }
  }

  const band = severityMeta(analysis.severity_score);
  parts.push(`Overall structural severity index ${formatSeverity(analysis.severity_score)}, rated ${band.label}.`);

  const critical = objects.filter((obj) => (obj.risk_score ?? 0) >= 0.7);
  if (critical.length > 0) {
    parts.push(
      `Priority attention required for: ${critical.map((obj) => obj.object_name).join(', ')}.`
    );
  }

  return parts.join(' ');
}
