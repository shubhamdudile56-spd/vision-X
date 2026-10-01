/**
 * In-memory persistence fallback.
 *
 * VisionX is designed for PostgreSQL, but a demo or presentation machine may
 * not have one running. When `DATABASE_URL` is missing or the pool cannot
 * connect, accounts and scans fall back to these process-lifetime stores so the
 * product stays fully usable. Data is clearly volatile: it is lost on restart
 * and the API reports `persistence: "memory"` on every affected response.
 */
import { randomUUID } from 'node:crypto';

const usersById = new Map();
const usersByEmail = new Map();
const scansById = new Map();

/** Shape of a scan row, matching the PostgreSQL column names. */
function makeScan({ id, user_id: userId, mode, source_type: sourceType, image_url: imageUrl, scene_category: category, scene_description: description, total_objects: totalObjects, highest_confidence: highestConfidence, severity_score: severity }) {
  return {
    id,
    user_id: userId ?? null,
    mode,
    source_type: sourceType,
    image_url: imageUrl,
    scene_category: category,
    scene_description: description,
    total_objects: totalObjects ?? 0,
    highest_confidence: highestConfidence ?? 0,
    severity_score: severity ?? 0,
    created_at: new Date()
  };
}

export const memoryStore = {
  // ------------------------------------------------------------------ users
  insertUser({ email, passwordHash, fullName, role }) {
    const user = {
      id: randomUUID(),
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role,
      created_at: new Date()
    };
    usersById.set(user.id, user);
    usersByEmail.set(user.email, user);
    return user;
  },

  findUserByEmail(email) {
    return usersByEmail.get(email) ?? null;
  },

  findUserById(id) {
    return usersById.get(id) ?? null;
  },

  // ------------------------------------------------------------------ scans
  insertScan(scan) {
    const record = makeScan({ id: randomUUID(), ...scan });
    scansById.set(record.id, record);
    return record;
  },

  insertObjects(scanId, objects) {
    const row = scansById.get(scanId);
    if (!row) return;
    row.detected_objects = objects.map((obj) => ({ id: randomUUID(), scan_id: scanId, ...obj }));
  },

  listScans({ userId, role, page, pageSize, search, mode, sourceType }) {
    const term = (search || '').toLowerCase();
    const all = [...scansById.values()]
      .filter((scan) => (role === 'admin' ? true : scan.user_id === userId))
      .filter((scan) => (mode && mode !== 'ALL' ? scan.mode === mode : true))
      .filter((scan) => (sourceType && sourceType !== 'ALL' ? scan.source_type === sourceType : true))
      .filter((scan) =>
        term
          ? `${scan.scene_category} ${scan.scene_description}`.toLowerCase().includes(term)
          : true
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const offset = (page - 1) * pageSize;
    return {
      rows: all.slice(offset, offset + pageSize),
      total: all.length
    };
  },

  getScan(id) {
    return scansById.get(id) ?? null;
  },

  deleteScan(id) {
    return scansById.delete(id);
  },

  allScans({ userId, role }) {
    return [...scansById.values()].filter((scan) => (role === 'admin' ? true : scan.user_id === userId));
  },

  clear() {
    usersById.clear();
    usersByEmail.clear();
    scansById.clear();
  }
};

export default memoryStore;
