/**
 * Zero-dependency dev launcher: starts the Express API and the Vite dev server
 * together and keeps their lifetimes tied to this process.
 *
 *   npm run dev          (from the repo root)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  { name: 'api', cwd: path.join(root, 'server'), args: ['run', 'dev'], color: '[36m' },
  { name: 'web', cwd: path.join(root, 'client'), args: ['run', 'dev'], color: '[35m' }
];

const RESET = '[0m';
const DIM = '[2m';
const children = [];
let shuttingDown = false;

function prefixStream(stream, target) {
  readline.createInterface({ input: stream, terminal: false }).on('line', (line) => {
    process.stdout.write(`${target.color}[${target.name}]${RESET} ${line}\n`);
  });
}

for (const target of TARGETS) {
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', target.args, {
    cwd: target.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: process.platform === 'win32'
  });

  prefixStream(child.stdout, target);
  prefixStream(child.stderr, target);

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`${target.color}[${target.name}]${RESET} ${DIM}exited with code ${code}${RESET}`);
    shutdown(code ?? 1);
  });

  children.push(child);
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`${DIM}VisionX dev — API on http://localhost:5000, web on http://localhost:5173${RESET}`);
