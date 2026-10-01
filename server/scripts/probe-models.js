/**
 * Probes the configured Gemini key against a set of candidate models using a
 * real image + structured-output request, and prints which ones serve traffic
 * right now. Used to choose a resilient model fallback chain.
 *
 *   node scripts/probe-models.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envRaw = fs.readFileSync(path.resolve(here, '..', '.env'), 'utf8');
const key = (/^GEMINI_API_KEY=(.*)$/m.exec(envRaw)?.[1] || '').trim();

if (!key) {
  console.error('No GEMINI_API_KEY in server/.env');
  process.exit(2);
}

// 1x1 red PNG — enough to prove image decoding works.
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

const SCHEMA = {
  type: 'OBJECT',
  properties: { scene_category: { type: 'STRING' } },
  required: ['scene_category']
};

async function probe(model) {
  const started = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inline_data: { mime_type: 'image/png', data: TINY_PNG } },
                { text: 'Describe this image in one word.' }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCHEMA,
            maxOutputTokens: 64
          }
        })
      }
    );
    const text = await response.text();
    const elapsed = Date.now() - started;
    if (response.status !== 200) {
      let message = text.slice(0, 120);
      try {
        message = JSON.parse(text).error?.message ?? message;
      } catch {
        /* keep raw */
      }
      return { model, status: response.status, ok: false, elapsed, message };
    }
    const parsed = JSON.parse(text);
    return {
      model,
      status: 200,
      ok: true,
      elapsed,
      message: parsed.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 60) ?? '(empty)'
    };
  } catch (err) {
    return { model, status: 0, ok: false, elapsed: Date.now() - started, message: err.message };
  }
}

const results = [];
for (const model of CANDIDATES) {
  const result = await probe(model);
  results.push(result);
  console.log(
    `${result.ok ? 'OK  ' : 'FAIL'} ${model.padEnd(24)} ${String(result.status).padStart(3)}  ${String(result.elapsed).padStart(5)}ms  ${result.message.replace(/\s+/g, ' ').slice(0, 90)}`
  );
}

const working = results.filter((r) => r.ok).map((r) => r.model);
console.log(`\nWorking models: ${working.length ? working.join(', ') : 'none'}\n`);
