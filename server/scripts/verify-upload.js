/**
 * Verifies the multipart upload path (`POST /api/vision/analyze-file`) against
 * real inference, including the magic-byte guard and persistence for an
 * authenticated user.
 *
 *   node scripts/verify-upload.js
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const BASE = process.env.BASE || 'http://localhost:5000';
const here = path.dirname(fileURLToPath(import.meta.url));

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

function encodePng(width, height, fill) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = fill(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      offset += 3;
    }
  }
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** A synthetic scene with a high-contrast red "hazard" panel on a grey wall. */
const png = encodePng(400, 300, (x, y) => {
  if (y > 210) return x % 30 < 15 ? [70, 74, 82] : [58, 62, 70];
  if (x > 60 && x < 200 && y > 50 && y < 180) return [200, 40, 40];
  if (x > 220 && x < 340 && y > 90 && y < 190) return [240, 200, 40];
  return [200, 205, 212];
});

async function main() {
  console.log(`\nVisionX multipart upload verification against ${BASE}\n`);

  const status = await (await fetch(`${BASE}/api/vision/status`)).json();
  if (!status.engine_configured) {
    console.log('  SKIP: no Gemini API key configured.\n');
    process.exit(2);
  }

  // --- guard rail: a non-image must be rejected before any inference ---------
  const fake = new FormData();
  fake.append('image', new Blob([Buffer.from('this is plain text, not an image')], { type: 'text/plain' }), 'notes.txt');
  const fakeResponse = await fetch(`${BASE}/api/vision/analyze-file`, { method: 'POST', body: fake });
  console.log(`  non-image upload rejected with ${fakeResponse.status} (expected 400)`);
  assert.equal(fakeResponse.status, 400, 'a non-image upload must be rejected');

  // --- real upload -----------------------------------------------------------
  const form = new FormData();
  form.append('image', new Blob([png], { type: 'image/png' }), 'synthetic-scene.png');
  form.append('mode', 'REAL');
  form.append('source_type', 'UPLOAD');

  const started = Date.now();
  const response = await fetch(`${BASE}/api/vision/analyze-file`, { method: 'POST', body: form });
  const payload = await response.json();
  const elapsed = Date.now() - started;

  if (response.status !== 200) {
    console.error(`  FAIL  upload returned ${response.status}: ${payload.error}`);
    process.exit(1);
  }

  assert.equal(payload.mode, 'REAL');
  assert.equal(payload.source_type, 'UPLOAD');
  assert.ok(Array.isArray(payload.detected_objects));
  assert.ok(payload.severity_score >= 0 && payload.severity_score <= 1);
  assert.ok(payload.source_image_ref.startsWith('inline:image/png:'), 'the server must record the real mime type');

  console.log(`  PASS  upload analysed in ${elapsed}ms by ${payload.model}`);
  console.log(`        scene:     ${payload.scene_category}`);
  console.log(`        severity:  ${payload.severity_score} (${payload.severity_band?.label})`);
  console.log(`        objects:   ${payload.detected_objects.length}`);
  console.log(`        storage:   ${payload.persistence}`);
  console.log(`\n        ${payload.scene_description}\n`);

  // --- authenticated persistence -------------------------------------------
  const email = `upload_${Date.now()}@visionx.test`;
  const register = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Str0ngPassw0rd', full_name: 'Upload Verifier' })
  });
  const cookie = (register.headers.getSetCookie?.() ?? []).find((c) => c.startsWith('visionx_token='));
  assert.ok(cookie, 'registration must issue a session cookie');

  const authForm = new FormData();
  authForm.append('image', new Blob([png], { type: 'image/png' }), 'synthetic-scene.png');
  authForm.append('mode', 'REAL');
  authForm.append('source_type', 'UPLOAD');

  const authResponse = await fetch(`${BASE}/api/vision/analyze-file`, {
    method: 'POST',
    body: authForm,
    headers: { Cookie: cookie.split(';')[0] }
  });
  const authPayload = await authResponse.json();
  assert.equal(authResponse.status, 200);
  assert.ok(authPayload.scan_id, 'an authenticated upload must be persisted');
  console.log(`  PASS  authenticated upload persisted as ${authPayload.scan_id} (${authPayload.persistence})`);

  const detail = await fetch(`${BASE}/api/scans/${authPayload.scan_id}`, {
    headers: { Cookie: cookie.split(';')[0] }
  });
  const detailPayload = await detail.json();
  assert.equal(detail.status, 200);
  assert.ok(detailPayload.scan.detected_objects.length > 0, 'detected objects must be stored with the scan');
  console.log(`  PASS  stored scan returns ${detailPayload.scan.detected_objects.length} detected objects`);

  const removed = await fetch(`${BASE}/api/scans/${authPayload.scan_id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie.split(';')[0] }
  });
  assert.equal(removed.status, 200);

  // --- filesystem hygiene: nothing written to disk ---------------------------
  const uploadsDir = path.resolve(here, '..', 'uploads');
  assert.ok(!fs.existsSync(uploadsDir), 'the server must never create an uploads/ directory');

  console.log('\n  Multipart upload path verified end to end.\n');
}

main().catch((err) => {
  console.error('\n  Verification failed:', err.message, '\n');
  process.exit(1);
});
