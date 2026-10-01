/**
 * Guest-mode scan history.
 *
 * Authenticated users persist scans to PostgreSQL through the API; guests (and
 * anyone whose database is unavailable) fall back to this namespaced local
 * store. Entries carry a `local_id` so they can be reconciled or exported.
 */
const STORAGE_KEY = 'visionx.scanHistory.v1';
const MAX_ENTRIES = 50;
const MAX_IMAGE_CHARS = 1_500_000; // ~1.1MB of base64 per thumbnail

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readRaw() {
  if (!isBrowser()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries) {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    // QuotaExceededError: drop thumbnails from the oldest entries and retry once.
    try {
      const trimmed = entries.slice(0, 15).map((entry) => ({ ...entry, image_data: null }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function listLocalScans() {
  return readRaw().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getLocalScan(id) {
  return readRaw().find((entry) => entry.local_id === id) || null;
}

export function saveLocalScan(analysis, { sourceType = 'UPLOAD', imageData = null, thumbnail = null } = {}) {
  const entry = {
    local_id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: analysis.mode ?? 'REAL',
    source_type: sourceType,
    scene_category: analysis.scene_category ?? 'Uncategorised Scene',
    scene_description: analysis.scene_description ?? '',
    summary: analysis.summary ?? '',
    severity_score: analysis.severity_score ?? 0,
    severity_band: analysis.severity_band?.level ?? 'nominal',
    total_objects: analysis.detected_objects?.length ?? 0,
    highest_confidence: analysis.highest_confidence ?? 0,
    unique_categories: analysis.unique_categories ?? [],
    detected_objects: analysis.detected_objects ?? [],
    created_at: analysis.analyzed_at || new Date().toISOString(),
    image_data: imageData && imageData.length <= MAX_IMAGE_CHARS ? imageData : null,
    thumbnail
  };

  const entries = [entry, ...readRaw().filter((item) => item.local_id !== entry.local_id)];
  writeRaw(entries);
  return entry;
}

export function deleteLocalScan(id) {
  const entries = readRaw();
  const next = entries.filter((entry) => entry.local_id !== id);
  writeRaw(next);
  return next.length !== entries.length;
}

export function clearLocalScans() {
  if (isBrowser()) window.localStorage.removeItem(STORAGE_KEY);
}

export function localStorageUsage() {
  if (!isBrowser()) return { bytes: 0, entries: 0, ratio: 0 };
  const bytes = (window.localStorage.getItem(STORAGE_KEY) || '').length;
  let quota = 5 * 1024 * 1024;
  try {
    // StorageManager is not universally available (Firefox private mode, Safari).
    if (navigator.storage?.estimate) {
      // synchronous read is impossible here, so approximate with the known quota
      quota = 5 * 1024 * 1024;
    }
  } catch {
    /* keep default */
  }
  return { bytes, entries: readRaw().length, ratio: Math.min(1, bytes / quota) };
}

/** Triggers a JSON download of any serialisable object. */
export function downloadJson(filename, data) {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export { STORAGE_KEY as LOCAL_HISTORY_KEY };
