/**
 * Finds the working Supabase pooler endpoint for a project by attempting a real
 * PostgreSQL connection against each candidate region. The pooler authenticates
 * only the project that belongs to it, so the first success is authoritative.
 *
 *   node scripts/connect-supabase.js <project-ref> <database-password> [mode]
 *
 * `mode` is `session` (port 5432, default — required for DDL and multi-statement
 * migrations) or `transaction` (port 6543).
 */
import pg from 'pg';

const ref = process.argv[2];
const password = process.argv[3];
const mode = process.argv[4] === 'transaction' ? 'transaction' : 'session';
const port = mode === 'transaction' ? 6543 : 5432;

if (!ref || !password) {
  console.error('usage: node scripts/connect-supabase.js <project-ref> <database-password> [session|transaction]');
  process.exit(2);
}

const REGIONS = [
  'us-east-1', 'us-west-1', 'us-west-2', 'ca-central-1', 'sa-east-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1'
];

async function attempt(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port,
    user: `postgres.${ref}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000
  });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() as db, current_user as usr, version() as version');
    await client.end();
    return { ok: true, host, port, rows: rows[0] };
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* already closed */
    }
    return { ok: false, host, port, code: err.code, message: err.message };
  }
}

console.log(`\nProbing Supabase pooler in ${mode} mode (port ${port}) for project ${ref}\n`);

let success = null;
for (const region of REGIONS) {
  const result = await attempt(region);
  if (result.ok) {
    console.log(`  OK    ${region.padEnd(16)} ${result.host}:${result.port}`);
    success = { ...result, region };
    break;
  }
  const detail = `${result.code ?? ''} ${result.message}`.trim().slice(0, 90);
  console.log(`  fail  ${region.padEnd(16)} ${detail}`);
}

if (!success) {
  console.log('\n  No pooler region accepted the credentials.\n');
  console.log('  Check the password, and confirm the project is not paused.\n');
  process.exit(1);
}

console.log(`\n  Connected: database=${success.rows.db} user=${success.rows.usr}`);
console.log(`  ${success.rows.version.split(',')[0]}\n`);
console.log('  Use this in server/.env:\n');
console.log(`  DATABASE_URL=postgresql://postgres.${ref}:<password>@${success.host}:${success.port}/postgres`);
console.log('  DATABASE_SSL=require\n');
process.exit(0);
