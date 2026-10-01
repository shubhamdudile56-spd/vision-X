/**
 * PostgreSQL access layer.
 *
 * The pool is created lazily and every query is funnelled through helpers so a
 * missing/unreachable database degrades gracefully (writes are skipped, reads
 * return empty sets) instead of crashing the API process.
 */
import pg from 'pg';
import config from './config/env.js';

const { Pool, types } = pg;

// Keep NUMERIC as JS numbers: confidence/severity are small bounded values and
// returning strings would break every arithmetic comparison downstream.
types.setTypeParser(1700, (value) => (value === null ? null : Number.parseFloat(value)));
types.setTypeParser(20, (value) => (value === null ? null : Number.parseInt(value, 10)));

let pool = null;
let dbDisabledReason = null;

export function isDatabaseEnabled() {
  return Boolean(config.databaseUrl) && dbDisabledReason === null;
}

export function getDatabaseDisabledReason() {
  return dbDisabledReason;
}

/**
 * Resolves the TLS setting for the pool.
 * Managed Postgres providers terminate TLS with a certificate that is not in
 * the Node trust store, so certificate verification is disabled while the
 * channel is still encrypted — the standard `pg` cloud configuration.
 */
function resolveSsl() {
  if (config.databaseSsl === 'disable') return false;
  if (config.databaseSsl === 'require' || config.isProduction) return { rejectUnauthorized: false };
  return false;
}

export function getPool() {
  if (!config.databaseUrl) {
    dbDisabledReason = 'DATABASE_URL is not configured';
    throw new Error(dbDisabledReason);
  }
  if (pool) return pool;

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: resolveSsl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000
  });

  pool.on('error', (err) => {
    // A pooled client failing while idle must never crash the server.
    // eslint-disable-next-line no-console
    console.error('[db] idle client error:', err.message);
    dbDisabledReason = err.message;
  });

  return pool;
}

/**
 * Execute a parameterised query.
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function query(text, params = []) {
  const client = getPool();
  return client.query(text, params);
}

/** Query that resolves to `null` instead of throwing (used for optional writes). */
export async function safeQuery(text, params = []) {
  try {
    return await query(text, params);
  } catch (err) {
    // Connection-level failures permanently degrade the process to the
    // in-memory store rather than retrying on every request.
    if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNRESET'].includes(err?.code)) {
      dbDisabledReason = err.message;
    }
    // eslint-disable-next-line no-console
    console.warn('[db] query failed:', err.message);
    return null;
  }
}

export async function verifyConnection() {
  if (!config.databaseUrl) return { ok: false, reason: 'DATABASE_URL is not configured' };
  try {
    const result = await query('SELECT 1 AS ok');
    return { ok: result.rows[0]?.ok === 1, reason: null };
  } catch (err) {
    dbDisabledReason = err.message;
    return { ok: false, reason: err.message };
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default { query, safeQuery, getPool, isDatabaseEnabled, verifyConnection, closePool };
