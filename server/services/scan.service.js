/**
 * Scan + detected-object persistence.
 *
 * All reads are tenant-scoped by the authenticated `user_id` coming from the
 * verified JWT — never from the request body. Writes fail soft so a database
 * outage degrades the product to "analysis without history" instead of a 500.
 */
import { safeQuery, isDatabaseEnabled, getPool } from '../db.js';
import memoryStore from '../db/memoryStore.js';
import { severityBand } from '../services/vision.service.js';

const SCAN_COLUMNS = `
  s.id, s.mode, s.source_type, s.image_url, s.scene_category, s.scene_description,
  s.total_objects, s.highest_confidence, s.severity_score, s.created_at, s.user_id
`;

/** Reports which storage layer actually served the request. */
export function persistenceLayer() {
  return isDatabaseEnabled() ? 'postgresql' : 'memory';
}

function mapScan(row) {
  if (!row) return null;
  const severity = Number(row.severity_score ?? 0);
  return {
    id: row.id,
    mode: row.mode,
    source_type: row.source_type,
    image_url: row.image_url,
    scene_category: row.scene_category,
    scene_description: row.scene_description,
    total_objects: Number(row.total_objects ?? 0),
    highest_confidence: Number(row.highest_confidence ?? 0),
    severity_score: severity,
    severity_band: severityBand(severity).level,
    created_at: row.created_at,
    user_id: row.user_id
  };
}

function mapObject(row) {
  const box = row.bounding_box ?? {};
  return {
    id: row.id,
    object_name: row.object_name,
    category: row.category,
    confidence: Number(row.confidence ?? 0),
    risk_score: box?.risk_score ?? 0,
    recommended_action: row.insight ?? '',
    bounding_box: {
      x_min: Number(box?.x_min ?? 0),
      y_min: Number(box?.y_min ?? 0),
      x_max: Number(box?.x_max ?? 0),
      y_max: Number(box?.y_max ?? 0)
    },
    insight: row.insight ?? '',
    created_at: row.created_at
  };
}

/**
 * Persists a full analysis result as one scan plus its detected objects.
 * @returns {Promise<string|null>} the new scan id, or null if persistence failed
 */
export async function persistScan({ userId, mode, sourceType, imageUrl, analysis }) {
  const objects = analysis.detected_objects ?? [];

  if (!isDatabaseEnabled()) {
    // Volatile fallback so history still works without PostgreSQL.
    const record = memoryStore.insertScan({
      user_id: userId ?? null,
      mode,
      source_type: sourceType,
      image_url: String(imageUrl ?? 'stored_in_buffer').slice(0, 2_000_000),
      scene_category: analysis.scene_category,
      scene_description: analysis.scene_description,
      total_objects: analysis.total_objects ?? objects.length,
      highest_confidence: analysis.highest_confidence ?? 0,
      severity_score: analysis.severity_score ?? 0
    });
    memoryStore.insertObjects(
      record.id,
      objects.map((obj) => ({
        object_name: obj.object_name,
        category: obj.category,
        confidence: obj.confidence,
        bounding_box: obj.bounding_box,
        insight: [obj.insight, obj.recommended_action].filter(Boolean).join(' Recommended action: ')
      }))
    );
    return record.id;
  }

  // The scan row and its detected objects are written in one transaction so a
  // failure can never leave a scan with zero objects (an orphaned history row).
  const client = await getPool().connect();
  let scanId = null;

  try {
    await client.query('BEGIN');

    const scanInsert = await client.query(
      `INSERT INTO scans
         (user_id, mode, source_type, image_url, scene_category, scene_description,
          total_objects, highest_confidence, severity_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId ?? null,
        mode,
        sourceType,
        String(imageUrl ?? 'stored_in_buffer').slice(0, 2_000_000),
        analysis.scene_category,
        analysis.scene_description,
        analysis.total_objects ?? objects.length,
        analysis.highest_confidence ?? 0,
        analysis.severity_score ?? 0
      ]
    );

    scanId = scanInsert.rows[0].id;

    if (objects.length > 0) {
      // PostgreSQL caps a statement at 65535 bind parameters, so very large
      // detection sets are written in chunks.
      const CHUNK_SIZE = Math.max(1, Math.floor(60000 / 6));

      for (let offset = 0; offset < objects.length; offset += CHUNK_SIZE) {
        const slice = objects.slice(offset, offset + CHUNK_SIZE);
        const values = [];
        const params = [];

        slice.forEach((obj, index) => {
          // Six columns per row, so the parameter stride must be six.
          const base = index * 6;
          values.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb, $${base + 6})`
          );
          params.push(
            scanId,
            obj.object_name,
            obj.category,
            obj.confidence,
            JSON.stringify({
              x_min: obj.bounding_box.x_min,
              y_min: obj.bounding_box.y_min,
              x_max: obj.bounding_box.x_max,
              y_max: obj.bounding_box.y_max
            }),
            [obj.insight, obj.recommended_action].filter(Boolean).join(' Recommended action: ')
          );
        });

        // eslint-disable-next-line no-await-in-loop
        await client.query(
          `INSERT INTO detected_objects (scan_id, object_name, category, confidence, bounding_box, insight)
           VALUES ${values.join(', ')}`,
          params
        );
      }
    }

    await client.query('COMMIT');
    return scanId;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // eslint-disable-next-line no-console
    console.error('[db] scan persistence failed, transaction rolled back:', err.message);
    scanId = null;
    return null;
  } finally {
    client.release();
  }
}

/** Paginated, filtered, tenant-scoped scan list. */
export async function listScans({ userId, role, page, pageSize, search, mode, sourceType }) {
  if (!isDatabaseEnabled()) {
    const { rows, total } = memoryStore.listScans({ userId, role, page, pageSize, search, mode, sourceType });
    return {
      scans: rows.map(mapScan),
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize),
      persistence_available: true,
      persistence: 'memory'
    };
  }

  const conditions = [];
  const params = [];

  if (role !== 'admin') {
    params.push(userId ?? null);
    conditions.push(`s.user_id = $${params.length}`);
  }
  if (mode && mode !== 'ALL') {
    params.push(mode);
    conditions.push(`s.mode = $${params.length}`);
  }
  if (sourceType && sourceType !== 'ALL') {
    params.push(sourceType);
    conditions.push(`s.source_type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(s.scene_category ILIKE $${params.length} OR s.scene_description ILIKE $${params.length})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const countResult = await safeQuery(`SELECT COUNT(*)::int AS total FROM scans s ${where}`, params);
  if (!countResult) {
    return { scans: [], total: 0, page, page_size: pageSize, pages: 0, persistence_available: false, persistence: 'unavailable' };
  }

  params.push(pageSize, offset);
  const rowsResult = await safeQuery(
    `SELECT ${SCAN_COLUMNS} FROM scans s ${where}
     ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const scans = (rowsResult?.rows ?? []).map(mapScan);
  const total = countResult.rows[0]?.total ?? 0;

  return {
    scans,
    total,
    page,
    page_size: pageSize,
    pages: Math.ceil(total / pageSize),
    persistence_available: true,
    persistence: 'postgresql'
  };
}

/** Single scan with its detected objects, tenant-checked in SQL. */
export async function getScanWithObjects({ id, userId, role }) {
  if (!isDatabaseEnabled()) {
    const row = memoryStore.getScan(id);
    if (!row) return null;
    if (role !== 'admin' && row.user_id !== userId) return null;
    return { ...mapScan(row), detected_objects: (row.detected_objects ?? []).map(mapObject) };
  }

  const params = [id];
  let ownership = '';
  if (role !== 'admin') {
    params.push(userId ?? null);
    ownership = ` AND s.user_id = $${params.length}`;
  }

  const scanResult = await safeQuery(`SELECT ${SCAN_COLUMNS} FROM scans s WHERE s.id = $1${ownership}`, params);
  const scan = mapScan(scanResult?.rows?.[0]);
  if (!scan) return null;

  const objectsResult = await safeQuery(
    `SELECT id, scan_id, object_name, category, confidence, bounding_box, insight, created_at
     FROM detected_objects WHERE scan_id = $1 ORDER BY confidence DESC`,
    [id]
  );

  return { ...scan, detected_objects: (objectsResult?.rows ?? []).map(mapObject) };
}

export async function deleteScan({ id, userId, role }) {
  if (!isDatabaseEnabled()) {
    const row = memoryStore.getScan(id);
    if (!row) return false;
    if (role !== 'admin' && row.user_id !== userId) return false;
    return memoryStore.deleteScan(id);
  }

  const params = [id];
  let ownership = '';
  if (role !== 'admin') {
    params.push(userId ?? null);
    ownership = ` AND user_id = $${params.length}`;
  }
  const result = await safeQuery(`DELETE FROM scans WHERE id = $1${ownership} RETURNING id`, params);
  return Boolean(result?.rows?.length);
}

/** Aggregated metrics for the analytics dashboard. */
export async function getAnalytics({ userId, role }) {
  if (!isDatabaseEnabled()) return getMemoryAnalytics({ userId, role });

  const params = [];
  let scope = '';
  if (role !== 'admin') {
    params.push(userId ?? null);
    scope = `WHERE user_id = $${params.length}`;
  }

  const totals = await safeQuery(
    `SELECT
       COUNT(*)::int                                     AS total_scans,
       COALESCE(SUM(total_objects), 0)::int              AS total_detected_objects,
       COALESCE(ROUND(AVG(highest_confidence)::numeric, 2), 0) AS avg_confidence,
       COALESCE(ROUND(AVG(severity_score)::numeric, 3), 0)     AS avg_severity,
       COALESCE(MAX(highest_confidence), 0)              AS peak_confidence,
       COALESCE(MAX(severity_score), 0)                  AS peak_severity,
       COUNT(*) FILTER (WHERE mode = 'DEMO')::int        AS demo_scans,
       COUNT(*) FILTER (WHERE mode = 'REAL')::int        AS real_scans,
       COUNT(*) FILTER (WHERE severity_score >= 0.7)::int AS critical_scans
     FROM scans ${scope}`,
    params
  );

  const recent = await safeQuery(
    `SELECT ${SCAN_COLUMNS} FROM scans s ${scope ? scope.replace('user_id', 's.user_id') : ''}
     ORDER BY s.created_at DESC LIMIT 12`,
    params
  );

  const categories = await safeQuery(
    `SELECT d.category, COUNT(*)::int AS occurrences, ROUND(AVG(d.confidence)::numeric, 2) AS avg_confidence
     FROM detected_objects d
     JOIN scans s ON s.id = d.scan_id
     ${scope ? scope.replace('user_id', 's.user_id') : ''}
     GROUP BY d.category
     ORDER BY occurrences DESC`,
    params
  );

  const topObjects = await safeQuery(
    `SELECT d.object_name, d.category, MAX(d.confidence) AS confidence, COUNT(*)::int AS seen_count
     FROM detected_objects d
     JOIN scans s ON s.id = d.scan_id
     ${scope ? scope.replace('user_id', 's.user_id') : ''}
     GROUP BY d.object_name, d.category
     ORDER BY confidence DESC, seen_count DESC
     LIMIT 8`,
    params
  );

  // 14-point severity/confidence trend for the dashboard chart.
  const trend = await safeQuery(
    `SELECT
       to_char(date_trunc('day', s.created_at), 'YYYY-MM-DD') AS bucket,
       ROUND(AVG(s.severity_score)::numeric, 3)               AS avg_severity,
       ROUND(AVG(s.highest_confidence)::numeric, 2)           AS avg_confidence,
       COUNT(*)::int                                          AS scans
     FROM scans s
     ${scope ? scope.replace('user_id', 's.user_id') : ''}
     GROUP BY bucket
     ORDER BY bucket ASC
     LIMIT 14`,
    params
  );

  const metrics = totals?.rows?.[0] ?? {
    total_scans: 0,
    total_detected_objects: 0,
    avg_confidence: 0,
    avg_severity: 0,
    peak_confidence: 0,
    peak_severity: 0,
    demo_scans: 0,
    real_scans: 0,
    critical_scans: 0
  };

  return {
    metrics: {
      ...metrics,
      unique_categories: categories?.rows?.length ?? 0
    },
    recent_scans: (recent?.rows ?? []).map(mapScan),
    category_breakdown: (categories?.rows ?? []).map((row) => ({
      category: row.category,
      occurrences: Number(row.occurrences),
      avg_confidence: Number(row.avg_confidence ?? 0)
    })),
    top_objects: (topObjects?.rows ?? []).map((row) => ({
      object_name: row.object_name,
      category: row.category,
      confidence: Number(row.confidence ?? 0),
      seen_count: Number(row.seen_count ?? 0)
    })),
    severity_trend: (trend?.rows ?? []).map((row) => ({
      bucket: row.bucket,
      avg_severity: Number(row.avg_severity ?? 0),
      avg_confidence: Number(row.avg_confidence ?? 0),
      scans: Number(row.scans ?? 0)
    })),
    persistence_available: Boolean(totals),
    persistence: totals ? 'postgresql' : 'unavailable'
  };
}

/** Same aggregate shape as the SQL path, computed over the in-memory store. */
function getMemoryAnalytics({ userId, role }) {
  const scans = memoryStore.allScans({ userId, role });

  const round = (value, digits) => Number((Math.round(value * 10 ** digits) / 10 ** digits).toFixed(digits));
  const sum = (list) => list.reduce((acc, value) => acc + value, 0);
  const mean = (list) => (list.length ? sum(list) / list.length : 0);

  const objects = scans.flatMap((scan) => scan.detected_objects ?? []);

  const categoryMap = new Map();
  objects.forEach((obj) => {
    const entry = categoryMap.get(obj.category) ?? { occurrences: 0, total: 0 };
    entry.occurrences += 1;
    entry.total += Number(obj.confidence ?? 0);
    categoryMap.set(obj.category, entry);
  });

  const topMap = new Map();
  objects.forEach((obj) => {
    const key = `${obj.object_name}||${obj.category}`;
    const entry = topMap.get(key) ?? {
      object_name: obj.object_name,
      category: obj.category,
      confidence: 0,
      seen_count: 0
    };
    entry.confidence = Math.max(entry.confidence, Number(obj.confidence ?? 0));
    entry.seen_count += 1;
    topMap.set(key, entry);
  });

  const dayMap = new Map();
  scans.forEach((scan) => {
    const bucket = String(scan.created_at).slice(0, 10);
    const entry = dayMap.get(bucket) ?? { bucket, severity: 0, confidence: 0, scans: 0 };
    entry.severity += Number(scan.severity_score ?? 0);
    entry.confidence += Number(scan.highest_confidence ?? 0);
    entry.scans += 1;
    dayMap.set(bucket, entry);
  });

  return {
    metrics: {
      total_scans: scans.length,
      total_detected_objects: sum(scans.map((scan) => Number(scan.total_objects ?? 0))),
      avg_confidence: round(mean(scans.map((scan) => Number(scan.highest_confidence ?? 0))), 2),
      avg_severity: round(mean(scans.map((scan) => Number(scan.severity_score ?? 0))), 3),
      peak_confidence: scans.length ? Math.max(...scans.map((scan) => Number(scan.highest_confidence ?? 0))) : 0,
      peak_severity: scans.length ? Math.max(...scans.map((scan) => Number(scan.severity_score ?? 0))) : 0,
      demo_scans: scans.filter((scan) => scan.mode === 'DEMO').length,
      real_scans: scans.filter((scan) => scan.mode === 'REAL').length,
      critical_scans: scans.filter((scan) => Number(scan.severity_score ?? 0) >= 0.7).length,
      unique_categories: categoryMap.size
    },
    recent_scans: [...scans]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12)
      .map(mapScan),
    category_breakdown: [...categoryMap.entries()]
      .map(([category, entry]) => ({
        category,
        occurrences: entry.occurrences,
        avg_confidence: round(mean([entry.total / entry.occurrences]), 2)
      }))
      .sort((a, b) => b.occurrences - a.occurrences),
    top_objects: [...topMap.values()]
      .sort((a, b) => b.confidence - a.confidence || b.seen_count - a.seen_count)
      .slice(0, 8),
    severity_trend: [...dayMap.values()]
      .map((entry) => ({
        bucket: entry.bucket,
        avg_severity: round(entry.severity / entry.scans, 3),
        avg_confidence: round(entry.confidence / entry.scans, 2),
        scans: entry.scans
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .slice(-14),
    persistence_available: true,
    persistence: 'memory'
  };
}

export default { persistScan, listScans, getScanWithObjects, deleteScan, getAnalytics };
