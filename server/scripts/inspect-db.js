/**
 * Inspects the live database: tables, indexes, RLS state, and row counts.
 * Read-only — safe to run against a real project.
 *
 *   node scripts/inspect-db.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const envRaw = fs.readFileSync(path.resolve(here, '..', '.env'), 'utf8');
const connectionString = (/^DATABASE_URL=(.*)$/m.exec(envRaw)?.[1] || '').trim();
const sslRequired = (/^DATABASE_SSL=(.*)$/m.exec(envRaw)?.[1] || '').trim() === 'require';

if (!connectionString) {
  console.error('No DATABASE_URL in server/.env');
  process.exit(2);
}

const client = new pg.Client({
  connectionString,
  ssl: sslRequired ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15_000
});

await client.connect();

const server = await client.query('select version() as version, current_database() as db, current_user as usr');
console.log(`\nConnected to ${server.rows[0].db} as ${server.rows[0].usr}`);
console.log(`  ${server.rows[0].version.split(',')[0]}\n`);

const tables = await client.query(
  `select table_name from information_schema.tables
   where table_schema = 'public' and table_name in ('users','scans','detected_objects')
   order by table_name`
);
console.log(`  Tables:     ${tables.rows.map((r) => r.table_name).join(', ') || 'none'}`);

const indexes = await client.query(
  `select indexname from pg_indexes
   where schemaname = 'public' and tablename in ('users','scans','detected_objects')
   order by indexname`
);
console.log(`  Indexes:    ${indexes.rows.length}`);
for (const row of indexes.rows) console.log(`              - ${row.indexname}`);

const rls = await client.query(
  `select relname, relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace
   and relname in ('users','scans','detected_objects') order by relname`
);
console.log(`  RLS:        ${rls.rows.map((r) => `${r.relname}=${r.relrowsecurity}`).join('  ')}`);

const policies = await client.query(
  `select tablename, policyname from pg_policies where schemaname = 'public' order by tablename, policyname`
);
console.log(`  Policies:   ${policies.rows.length ? '' : 'none'}`);
for (const row of policies.rows) console.log(`              - ${row.tablename}.${row.policyname}`);

for (const table of ['users', 'scans', 'detected_objects']) {
  // eslint-disable-next-line no-await-in-loop
  const count = await client.query(`select count(*)::int as n from ${table}`);
  console.log(`  ${table.padEnd(18)} ${count.rows[0].n} row(s)`);
}

const columns = await client.query(
  `select table_name, column_name, data_type from information_schema.columns
   where table_schema = 'public' and table_name in ('users','scans','detected_objects')
   order by table_name, ordinal_position`
);
console.log('\n  Column contract:');
let current = null;
for (const row of columns.rows) {
  if (row.table_name !== current) {
    current = row.table_name;
    console.log(`    ${current}:`);
  }
  console.log(`      ${row.column_name} ${row.data_type}`);
}

await client.end();
console.log('');
