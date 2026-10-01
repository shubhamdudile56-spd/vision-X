/**
 * End-to-end API smoke test (no test framework required).
 *   npm run smoke            → boots nothing, expects the API already running
 *   BASE=http://localhost:5000 npm run smoke
 */
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:5000';

let passed = 0;
let failed = 0;

async function call(method, path, { body, raw, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (raw) {
    init.body = raw;
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}

async function main() {
  console.log(`\nVisionX API smoke test against ${BASE}\n`);

  await test('GET /api/health returns ok', async () => {
    const { status, json } = await call('GET', '/api/health');
    assert.equal(status, 200);
    assert.equal(json.status, 'ok');
  });

  await test('GET /api/vision/status advertises capabilities', async () => {
    const { status, json } = await call('GET', '/api/vision/status');
    assert.equal(status, 200);
    assert.equal(typeof json.engine_configured, 'boolean');
    assert.ok(Array.isArray(json.demo_scenes) && json.demo_scenes.length > 0);
  });

  await test('POST /api/vision/analyze rejects malformed payload with 400', async () => {
    const { status, json } = await call('POST', '/api/vision/analyze', { body: { image_data: 'nope' } });
    assert.equal(status, 400);
    assert.ok(json.error);
  });

  await test('POST /api/vision/analyze DEMO returns simulated payload with notice', async () => {
    const { status, json } = await call('POST', '/api/vision/analyze', {
      body: { image_data: 'data:image/png;base64,AAAA', mode: 'DEMO', source_type: 'UPLOAD', persist: false }
    });
    assert.equal(status, 200);
    assert.equal(json.mode, 'DEMO');
    assert.equal(json.is_simulated, true);
    assert.match(json.demo_notice, /SIMULATED MODE/);
    assert.ok(json.detected_objects.length > 0);
    assert.ok(json.severity_score >= 0 && json.severity_score <= 1);
  });

  await test('POST /api/vision/analyze REAL returns a contract-valid result or a sanitized error', async () => {
    const { status: statusCode, json: engine } = await call('GET', '/api/vision/status');
    const payload = {
      image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      mode: 'REAL',
      source_type: 'UPLOAD',
      persist: false
    };

    if (engine.engine_configured) {
      // A key is loaded: inference may legitimately succeed.
      const { status, json } = await call('POST', '/api/vision/analyze', { body: payload });
      if (status === 200) {
        assert.equal(json.mode, 'REAL');
        assert.equal(json.is_simulated, false);
        assert.ok(Array.isArray(json.detected_objects));
        assert.ok(json.severity_score >= 0 && json.severity_score <= 1);
        return;
      }
    }

    const { status, json } = await call('POST', '/api/vision/analyze', { body: payload });
    // No key: 400/503. Upstream failure: 502. Never a raw provider payload.
    assert.ok([400, 502, 503].includes(status), `expected 400/502/503, got ${status}`);
    assert.ok(json.error, 'an error message is required');
    assert.ok(json.error.length < 300, `error message must be short and sanitised, got ${json.error.length} chars`);
    assert.ok(!json.error.includes('generativelanguage'), 'raw upstream payload must not leak');
    assert.ok(!/AIza|AQ\./.test(json.error), 'no credential material may appear in the error');
  });

  await test('POST /api/vision/analyze-file rejects a non-image payload', async () => {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('not-an-image')], { type: 'text/plain' }), 'evil.txt');
    const res = await fetch(`${BASE}/api/vision/analyze-file`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
  });

  await test('POST /api/vision/analyze-file rejects declared-mime content mismatch', async () => {
    // Declares image/png but the bytes are a PDF header — magic byte check must catch it.
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('%PDF-1.7 fake')], { type: 'image/png' }), 'fake.png');
    form.append('mode', 'DEMO');
    const res = await fetch(`${BASE}/api/vision/analyze-file`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
  });

  await test('GET /api/scans without a token returns 401', async () => {
    const { status } = await call('GET', '/api/scans');
    assert.equal(status, 401);
  });

  await test('GET /api/analytics without a token returns 401', async () => {
    const { status } = await call('GET', '/api/analytics');
    assert.equal(status, 401);
  });

  await test('GET /api/analytics with a forged token returns 403', async () => {
    const { status } = await call('GET', '/api/analytics', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UifQ.bad' }
    });
    assert.equal(status, 403);
  });

  await test('POST /api/auth/register rejects a weak password', async () => {
    const { status, json } = await call('POST', '/api/auth/register', {
      body: { email: 'inspector@visionx.dev', password: 'short', full_name: 'Ada Inspector' }
    });
    assert.equal(status, 400);
    assert.ok(Array.isArray(json.details));
  });

  await test('POST /api/auth/register rejects a malformed email', async () => {
    const { status } = await call('POST', '/api/auth/register', {
      body: { email: 'not-an-email', password: 'Str0ngPass!', full_name: 'Ada Inspector' }
    });
    assert.equal(status, 400);
  });

  await test('GET /api/vision/credentials reports status without leaking key material', async () => {
    const { status, json } = await call('GET', '/api/vision/credentials');
    assert.equal(status, 200);
    assert.equal(typeof json.configured, 'boolean');
    const serialised = JSON.stringify(json);
    assert.ok(!serialised.includes('AIza'), 'no raw key may appear in the response');
  });

  await test('PUT /api/vision/credentials rejects a placeholder key', async () => {
    const { status, json } = await call('PUT', '/api/vision/credentials', {
      body: { api_key: 'replace_with_your_gemini_api_key' }
    });
    assert.equal(status, 400);
    assert.ok(Array.isArray(json.details) || json.error);
  });

  await test('PUT /api/vision/credentials rejects a too-short key', async () => {
    const { status } = await call('PUT', '/api/vision/credentials', { body: { api_key: 'abc123' } });
    assert.equal(status, 400);
  });

  await test('Unknown route returns JSON 404', async () => {
    const { status, json } = await call('GET', '/api/does-not-exist');
    assert.equal(status, 404);
    assert.ok(json.error);
  });

  await test('Disallowed CORS origin is rejected', async () => {
    const { status } = await call('GET', '/api/health', { headers: { Origin: 'http://evil.example' } });
    assert.equal(status, 500);
  });

  // ---------------------------------------------------------------- full flow
  const email = `smoke_${Date.now()}@visionx.test`;
  const password = 'Str0ngPassw0rd';
  const cookieJar = {};

  await test('POST /api/auth/register creates an account and sets an httpOnly cookie', async () => {
    const { status, json, headers } = await call('POST', '/api/auth/register', {
      body: { email, password, full_name: 'Smoke Inspector' }
    });
    assert.equal(status, 201);
    assert.equal(json.user.email, email);
    assert.equal(json.user.role, 'inspector');
    assert.ok(json.token, 'a JWT is returned for non-browser clients');

    const setCookie = headers.getSetCookie?.() ?? [];
    const authCookie = setCookie.find((cookie) => cookie.startsWith('visionx_token='));
    assert.ok(authCookie, 'an auth cookie must be issued');
    assert.match(authCookie, /HttpOnly/i, 'the session cookie must be httpOnly');
    assert.match(authCookie, /SameSite/i, 'the session cookie must set SameSite');
    cookieJar.auth = authCookie.split(';')[0];
  });

  await test('Duplicate registration is rejected with 409', async () => {
    const { status, json } = await call('POST', '/api/auth/register', {
      body: { email, password, full_name: 'Smoke Inspector' }
    });
    assert.equal(status, 409);
    assert.match(json.error, /already exists/i);
  });

  await test('POST /api/auth/login rejects a wrong password', async () => {
    const { status, json } = await call('POST', '/api/auth/login', {
      body: { email, password: 'Wr0ngPassw0rd' }
    });
    assert.equal(status, 401);
    assert.match(json.error, /Invalid email or password/i);
  });

  await test('POST /api/auth/login with a cookie session reaches protected routes', async () => {
    const login = await call('POST', '/api/auth/login', {
      body: { email, password },
      headers: { Cookie: cookieJar.auth }
    });
    assert.equal(login.status, 200);
    assert.ok(login.json.user.id);

    const me = await call('GET', '/api/auth/me', { headers: { Cookie: cookieJar.auth } });
    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, email);
  });

  await test('Full pipeline: analyze (DEMO) → list → detail → analytics → delete', async () => {
    const analysis = await call('POST', '/api/vision/analyze', {
      body: {
        image_data: 'data:image/png;base64,AAAA',
        mode: 'DEMO',
        source_type: 'UPLOAD',
        persist: true
      },
      headers: { Cookie: cookieJar.auth }
    });
    assert.equal(analysis.status, 200);
    assert.ok(analysis.json.scan_id, 'a signed-in scan must be persisted');
    assert.ok(analysis.json.detected_objects.length > 0);

    const list = await call('GET', '/api/scans?page=1&page_size=5', { headers: { Cookie: cookieJar.auth } });
    assert.equal(list.status, 200);
    assert.ok(list.json.total >= 1);
    assert.equal(list.json.scans[0].mode, 'DEMO');

    const detail = await call('GET', `/api/scans/${analysis.json.scan_id}`, {
      headers: { Cookie: cookieJar.auth }
    });
    assert.equal(detail.status, 200);
    assert.ok(detail.json.scan.detected_objects.length > 0);
    const box = detail.json.scan.detected_objects[0].bounding_box;
    assert.ok(box.x_min >= 0 && box.x_max <= 100, 'bounding boxes stay normalised');

    const analytics = await call('GET', '/api/analytics', { headers: { Cookie: cookieJar.auth } });
    assert.equal(analytics.status, 200);
    assert.ok(analytics.json.metrics.total_scans >= 1);
    assert.ok(Array.isArray(analytics.json.severity_trend));

    const removed = await call('DELETE', `/api/scans/${analysis.json.scan_id}`, {
      headers: { Cookie: cookieJar.auth }
    });
    assert.equal(removed.status, 200);
  });

  await test('Tenant isolation: a second account cannot read the first account scan', async () => {
    const other = `smoke_other_${Date.now()}@visionx.test`;
    const created = await call('POST', '/api/auth/register', {
      body: { email: other, password, full_name: 'Other Inspector' }
    });
    assert.equal(created.status, 201);
    const otherCookie = (created.headers.getSetCookie?.() ?? []).find((c) => c.startsWith('visionx_token='));
    assert.ok(otherCookie);

    const mine = await call('POST', '/api/vision/analyze', {
      body: { image_data: 'data:image/png;base64,AAAA', mode: 'DEMO', source_type: 'CAMERA', persist: true },
      headers: { Cookie: cookieJar.auth }
    });
    const scanId = mine.json.scan_id;
    assert.ok(scanId);

    const list = await call('GET', '/api/scans', { headers: { Cookie: otherCookie.split(';')[0] } });
    assert.equal(list.status, 200);
    assert.equal(list.json.total, 0, 'a fresh tenant must see zero scans');
    assert.ok(!list.json.scans.some((scan) => scan.id === scanId));

    const detail = await call('GET', `/api/scans/${scanId}`, {
      headers: { Cookie: otherCookie.split(';')[0] }
    });
    assert.equal(detail.status, 404, 'cross-tenant reads must 404');

    await call('DELETE', `/api/scans/${scanId}`, { headers: { Cookie: cookieJar.auth } });
  });

  await test('POST /api/scans persists a client-supplied analysis', async () => {
    const { status, json } = await call('POST', '/api/scans', {
      headers: { Cookie: cookieJar.auth },
      body: {
        mode: 'DEMO',
        source_type: 'UPLOAD',
        image_url: 'demo_reference',
        scene_category: 'Manual Entry Scene',
        scene_description: 'A scan submitted directly through the history API.',
        severity_score: 0.4,
        detected_objects: [
          {
            object_name: 'Test Object',
            category: 'General Object',
            confidence: 88,
            bounding_box: { x_min: 10, y_min: 10, x_max: 40, y_max: 40 },
            insight: 'Synthetic record for API verification.'
          }
        ]
      }
    });
    assert.equal(status, 201);
    assert.ok(json.scan_id);

    const removed = await call('DELETE', `/api/scans/${json.scan_id}`, { headers: { Cookie: cookieJar.auth } });
    assert.equal(removed.status, 200);
  });

  await test('POST /api/scans rejects an out-of-range bounding box', async () => {
    const { status } = await call('POST', '/api/scans', {
      headers: { Cookie: cookieJar.auth },
      body: {
        scene_category: 'Bad Box',
        scene_description: 'Bounding box exceeds the 0-100 contract.',
        image_url: 'x',
        detected_objects: [
          {
            object_name: 'Oversized',
            category: 'General Object',
            confidence: 50,
            bounding_box: { x_min: -20, y_min: 10, x_max: 400, y_max: 40 },
            insight: ''
          }
        ]
      }
    });
    assert.equal(status, 400);
  });

  await test('GET /api/scans rejects a non-UUID id with 400', async () => {
    const { status } = await call('GET', '/api/scans/not-a-uuid', { headers: { Cookie: cookieJar.auth } });
    assert.equal(status, 400);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
