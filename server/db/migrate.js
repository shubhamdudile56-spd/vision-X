/**
 * Idempotent schema migration runner.
 *   node db/migrate.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool } from '../db.js';
import config from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  if (!config.databaseUrl) {
    console.error('[migrate] DATABASE_URL is not configured. Nothing to do.');
    process.exitCode = 1;
    return;
  }

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await query(sql);
    console.log('[migrate] VisionX schema applied successfully.');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

migrate();
