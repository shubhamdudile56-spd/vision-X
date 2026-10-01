/**
 * Discovers the Supabase pooler region for a project ref.
 *
 * Supabase direct connections (`db.<ref>.supabase.co`) are IPv6-only, so an
 * IPv4-only host must use the pooler (`aws-0-<region>.pooler.supabase.com`).
 * The region is not encoded in the project ref, so each candidate is resolved
 * and probed on the pooler port.
 *
 *   node scripts/discover-pooler.js <project-ref> [database-password]
 */
import net from 'node:net';
import dns from 'node:dns/promises';

const ref = process.argv[2];
const password = process.argv[3];

if (!ref) {
  console.error('usage: node scripts/discover-pooler.js <project-ref> [database-password]');
  process.exit(2);
}

const REGIONS = [
  'us-east-1', 'us-west-1', 'us-west-2',
  'ca-central-1',
  'sa-east-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'ap-south-2'
];

const PORTS = [6543, 5432];

function probe(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok, note) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ok, note });
    };
    socket.setTimeout(timeout);
    socket.on('connect', () => done(true, 'open'));
    socket.on('timeout', () => done(false, 'timeout'));
    socket.on('error', (err) => done(false, err.code || err.message));
  });
}

console.log(`\nDiscovering the pooler region for project ref "${ref}"\n`);

const candidates = [];
for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  try {
    // eslint-disable-next-line no-await-in-loop
    const { address } = await dns.lookup(host, { family: 4 });
    candidates.push({ region, host, address });
  } catch {
    /* region host does not exist for this provider */
  }
}

console.log(`  ${candidates.length} region host(s) resolve over IPv4:\n`);
for (const candidate of candidates) {
  const results = [];
  for (const port of PORTS) {
    // eslint-disable-next-line no-await-in-loop
    const result = await probe(candidate.host, port);
    results.push({ port, ...result });
  }
  const summary = results.map((r) => `${r.port}:${r.ok ? 'OPEN' : r.note}`).join('  ');
  console.log(`  ${candidate.region.padEnd(16)} ${candidate.address.padEnd(16)} ${summary}`);
}

if (password) {
  console.log('\n  Connect with:');
  for (const candidate of candidates) {
    for (const port of PORTS) {
      console.log(
        `    postgresql://postgres.${ref}:<password>@${candidate.host}:${port}/postgres`
      );
    }
  }
}
console.log('');
