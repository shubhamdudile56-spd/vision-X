/**
 * End-to-end verification of the REAL vision pipeline against Google Gemini.
 *
 * Generates a synthetic image in-process (no fixture files), sends it through
 * POST /api/vision/analyze, and asserts the response satisfies the analysis
 * contract the UI depends on.
 *
 *   node scripts/verify-vision.js
 *
 * Exits non-zero on any contract violation, so it is usable in CI.
 */
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const BASE = process.env.BASE || 'http://localhost:5000';

/** Minimal PNG encoder: builds an RGB image from a pixel-fill callback. */
function encodePng(width, height, fill) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0; // filter type: none
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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

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

/** A synthetic "workshop" scene: wall, floor, bench, drum, crate. */
function workshop(x, y) {
  const W = 480;
  const H = 360;
  if (y > 240) {
    // floor
    return x % 40 < 20 ? [58, 62, 70] : [48, 52, 60];
  }
  if (y > 150 && y < 240 && x > 60 && x < 300) {
    // steel bench
    return y < 165 ? [150, 155, 165] : [86, 92, 104];
  }
  if (y > 60 && y < 150 && x > 90 && x < 200) {
    // blue machine housing
    return [40, 90, 170];
  }
  if (y > 40 && y < 170 && x > 250 && x < 340) {
    // orange drum
    return [210, 110, 40];
  }
  if (y > 175 && y < 250 && x > 350 && x < 440) {
    // wooden crate
    return [150, 105, 60];
  }
  void W;
  void H;
  return [206, 212, 220];
}

async function main() {
  console.log(`\nVisionX real-inference verification against ${BASE}\n`);

  const status = await (await fetch(`${BASE}/api/vision/status`)).json();
  console.log(`  engine_configured: ${status.engine_configured}`);
  console.log(`  model:             ${status.model}`);

  if (!status.engine_configured) {
    console.log('\n  SKIP: no Gemini API key configured. Real inference cannot be verified.\n');
    process.exit(2);
  }

  const png = encodePng(480, 360, workshop);
  const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
  console.log(`  synthetic image:   480x360 PNG, ${png.length} bytes\n`);

  const started = Date.now();
  const response = await fetch(`${BASE}/api/vision/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_data: dataUrl, mode: 'REAL', source_type: 'UPLOAD', persist: false })
  });

  const payload = await response.json();
  const elapsed = Date.now() - started;

  if (response.status !== 200) {
    console.error(`  FAIL  analyze returned ${response.status}: ${payload.error}`);
    process.exit(1);
  }

  const objects = payload.detected_objects ?? [];

  assert.equal(payload.mode, 'REAL', 'mode must be REAL');
  assert.equal(payload.is_simulated, false, 'real results must not be flagged simulated');
  assert.equal(typeof payload.scene_category, 'string');
  assert.ok(payload.scene_category.length > 0, 'scene_category must be non-empty');
  assert.ok(payload.scene_description.length > 20, 'scene_description must be a real sentence');
  assert.ok(payload.severity_score >= 0 && payload.severity_score <= 1, 'severity must be within 0..1');
  assert.ok(Array.isArray(objects), 'detected_objects must be an array');

  for (const obj of objects) {
    assert.ok(obj.object_name, 'every object needs a name');
    assert.ok(obj.category, 'every object needs a category');
    assert.ok(obj.confidence >= 0 && obj.confidence <= 100, `confidence out of range: ${obj.confidence}`);
    const { x_min: x0, y_min: y0, x_max: x1, y_max: y1 } = obj.bounding_box;
    assert.ok(
      x0 >= 0 && y0 >= 0 && x1 <= 100 && y1 <= 100 && x1 > x0 && y1 > y0,
      `bounding box not normalised for ${obj.object_name}: ${JSON.stringify(obj.bounding_box)}`
    );
    assert.ok(typeof obj.insight === 'string' && obj.insight.length > 0, 'insight must be present');
  }

  console.log(`  PASS  response contract satisfied in ${elapsed}ms`);
  console.log(`        scene:     ${payload.scene_category}`);
  console.log(`        severity:  ${payload.severity_score} (${payload.severity_band?.label})`);
  console.log(`        objects:   ${objects.length}`);
  console.log(`        top conf:  ${payload.highest_confidence}%`);
  console.log(`\n  Scene description:`);
  console.log(`        ${payload.scene_description}\n`);
  console.log('  Top detections:');
  for (const obj of objects.slice(0, 5)) {
    const { x_min: x0, y_min: y0, x_max: x1, y_max: y1 } = obj.bounding_box;
    console.log(
      `        ${String(Math.round(obj.confidence)).padStart(3)}%  ${obj.object_name.padEnd(28).slice(0, 28)} [${obj.category}] box(${Math.round(x0)},${Math.round(y0)})-(${Math.round(x1)},${Math.round(y1)})`
    );
  }
  console.log('\n  Real vision pipeline verified.\n');
}

main().catch((err) => {
  console.error('\n  Verification failed:', err.message, '\n');
  process.exit(1);
});
