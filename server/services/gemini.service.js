/**
 * Google Gemini (Vision) integration via @google/genai.
 *
 * The API key is never accepted from the browser into the bundle. It is read
 * from the server environment, and can additionally be supplied at runtime
 * through `POST /api/vision/credentials`, which stores it in the server's
 * memory (never in the client, never in a response body).
 */
import { GoogleGenAI, Type } from '@google/genai';
import config from '../config/env.js';
import { upstreamError, HttpError } from '../utils/errors.js';

let client = null;

/**
 * Runtime key, set through the credentials endpoint.
 * `null` means "use the environment key".
 */
let runtimeApiKey = null;

export function isGeminiConfigured() {
  return Boolean(runtimeApiKey || config.geminiApiKey);
}

/** Which source the active key came from. */
export function keySource() {
  if (runtimeApiKey) return 'runtime';
  if (config.geminiApiKey) return 'env';
  return null;
}

/**
 * A non-reversible hint so the UI can show *which* key is loaded without ever
 * echoing key material back to the browser.
 */
export function keyHint() {
  const key = runtimeApiKey || config.geminiApiKey;
  if (!key) return null;
  return `••••••••${key.slice(-4)}`;
}

/** Registers a runtime key and rebuilds the client. */
export function setRuntimeApiKey(apiKey) {
  runtimeApiKey = apiKey;
  client = null;
}

/** Drops the runtime key, falling back to the environment key. */
export function clearRuntimeApiKey() {
  runtimeApiKey = null;
  client = null;
}

export function getClient() {
  const apiKey = runtimeApiKey || config.geminiApiKey;
  if (!apiKey) {
    throw new HttpError(503, 'No Gemini API key is configured. Add one from the VisionX key panel to enable Real Vision AI Mode.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Strict JSON schema the model must conform to. */
export const VISION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scene_category: { type: Type.STRING, description: 'Short scene label, e.g. "Industrial Plant Floor"' },
    scene_description: {
      type: Type.STRING,
      description: 'One or two natural language sentences describing the overall scene and its spatial layout'
    },
    severity_score: {
      type: Type.NUMBER,
      description: 'Structural / hazard severity index between 0.0 (nominal) and 1.0 (critical)'
    },
    summary: { type: Type.STRING, description: 'Concise operator-facing summary of the inspection in 2-3 sentences' },
    detected_objects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          object_name: { type: Type.STRING, description: 'Specific name of the item, e.g. "Hydraulic Pressure Gauge"' },
          category: {
            type: Type.STRING,
            description:
              'One of: Industrial Inspection, Safety & EHS, General Object, Document & OCR, Surface Defect'
          },
          confidence: { type: Type.NUMBER, description: 'Detection confidence percentage 0-100' },
          risk_score: { type: Type.NUMBER, description: 'Per-object risk severity 0.0-1.0' },
          recommended_action: { type: Type.STRING, description: 'Concrete next step an operator should take' },
          bounding_box: {
            type: Type.OBJECT,
            properties: {
              x_min: { type: Type.NUMBER, description: 'Left edge as a percentage of image width (0-100)' },
              y_min: { type: Type.NUMBER, description: 'Top edge as a percentage of image height (0-100)' },
              x_max: { type: Type.NUMBER, description: 'Right edge as a percentage of image width (0-100)' },
              y_max: { type: Type.NUMBER, description: 'Bottom edge as a percentage of image height (0-100)' }
            },
            required: ['x_min', 'y_min', 'x_max', 'y_max'],
            propertyOrdering: ['x_min', 'y_min', 'x_max', 'y_max']
          },
          insight: { type: Type.STRING, description: 'Why this item matters and what was observed' }
        },
        required: [
          'object_name',
          'category',
          'confidence',
          'risk_score',
          'recommended_action',
          'bounding_box',
          'insight'
        ],
        propertyOrdering: [
          'object_name',
          'category',
          'confidence',
          'risk_score',
          'recommended_action',
          'bounding_box',
          'insight'
        ]
      }
    }
  },
  required: ['scene_category', 'scene_description', 'severity_score', 'summary', 'detected_objects'],
  propertyOrdering: ['scene_category', 'scene_description', 'severity_score', 'summary', 'detected_objects']
};

export const SYSTEM_INSTRUCTION = `You are VisionX Core AI, a precision computer vision engine used for industrial inspection, workplace safety (EHS), retail inventory, and technical document analysis.
Provide pixel-accurate normalized bounding coordinates (percentages 0-100 relative to the full image), realistic confidence values, and actionable operational insights.
If no defects or hazards are visible, report the scene as nominal and do not invent defects. Never describe a document or photograph as something it is not.`;

const PROMPT = `Analyze this visual input comprehensively.

1. Classify the scene and describe it in natural language.
2. List every distinct, clearly visible object. For each one give a normalized bounding box, a confidence percentage, an object-level risk score (0.0-1.0), one sentence of insight, and one concrete recommended action.
3. Pay special attention to: cracks, corrosion, spalling, misalignment and other surface defects; missing PPE (helmets, hi-vis vests), blocked fire exits and trip hazards; furniture, electronics and vehicle counts; serial numbers, tags, schematics and printed form fields.
4. Compute an overall severity_score between 0.0 (nothing wrong) and 1.0 (critical, immediate danger).
5. Return at most 25 objects, prioritising the most operationally significant ones.`;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/** Errors that mean "this model cannot serve right now" → try the next model. */
const OVERLOADED_STATUS = new Set([429, 500, 502, 503, 504]);
const OVERLOADED_PATTERN = /high demand|capacity|overloaded|rate limit|quota|resource_exhausted|unavailable|try again later/i;

function isOverloaded(err) {
  const status = Number(err?.status ?? err?.code);
  if (OVERLOADED_STATUS.has(status)) return true;
  return OVERLOADED_PATTERN.test(String(err?.message ?? ''));
}

/**
 * Turns an SDK error into a short, human-readable message.
 * The Google SDK embeds a full JSON `ApiError` payload in `err.message`; that
 * must never reach the client, so only the innermost human text is kept.
 */
function extractMessage(err) {
  const raw = String(err?.message || '').trim();
  if (!raw) return 'Vision inference failed';

  const status = err?.status ?? err?.code;

  // Auth / quota problems are configuration issues, not upstream outages.
  if (status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|API key not valid/i.test(raw)) {
    return 'Gemini rejected the configured API key. Check GEMINI_API_KEY on the server.';
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return 'Gemini rate limit or quota exhausted. Try again shortly.';
  }
  if (status === 404 || /NOT_FOUND/i.test(raw)) {
    const match = /model[s]? "?([\w.\-]+)"?/.exec(raw);
    const named = match?.[1] ? `"${match[1]}" ` : '';
    return `Gemini model ${named}is not available for this key.`;
  }

  // Pull the first `message` field out of the embedded JSON error payload.
  const jsonMatch = /"message"\s*:\s*"([^"]{5,240})"/.exec(raw);
  if (jsonMatch) return jsonMatch[1];
  if (raw.startsWith('{') || raw.length > 240) return 'Vision inference failed upstream';
  return raw;
}

/**
 * Runs Gemini inference on an image buffer.
 *
 * Tries the primary model, then each configured fallback. A model that answers
 * with a capacity error (503 "high demand") is abandoned for this request
 * rather than retried, because capacity errors do not clear within a retry
 * window — the next model is the useful move. Genuine transients on the last
 * model still get exponential backoff.
 *
 * @param {Buffer} buffer raw image bytes
 * @param {string} mimeType validated image mime type
 * @returns {Promise<{payload: object, model: string}>}
 */
export async function analyzeImage(buffer, mimeType) {
  const ai = getClient();
  const chain = [config.geminiModel, ...config.geminiFallbackModels];
  const encoded = buffer.toString('base64');

  let lastError = { message: 'Vision inference failed', status: 0 };
  const overloaded = [];

  for (let index = 0; index < chain.length; index += 1) {
    const model = chain[index];
    const isLast = index === chain.length - 1;

    for (let attempt = 0; attempt < (isLast ? 3 : 1); attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: { mimeType, data: encoded }
            },
            PROMPT
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: VISION_RESPONSE_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });

        const text = response?.text;
        if (!text) throw new Error('Model returned an empty response');

        if (index > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[gemini] "${config.geminiModel}" was unavailable (${overloaded.join('; ')}); served by "${model}".`
          );
        }

        return { payload: parseModelJson(text), model };
      } catch (err) {
        const status = err?.status ?? err?.code;
        lastError = { message: extractMessage(err), status: Number(status) || 0 };

        if (isOverloaded(err) && !isLast) {
          overloaded.push(`${model}: ${lastError.message}`);
          break; // move to the next model in the chain
        }

        const retryable = RETRYABLE_STATUS.has(status) || err?.name === 'AbortError';
        if (!retryable || attempt === 2) break;
        // Exponential backoff with a hard cap.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      }
    }
  }

  // eslint-disable-next-line no-console
  console.error('[gemini] inference failed on every model in the chain:', lastError.message);
  if (overloaded.length) {
    // eslint-disable-next-line no-console
    console.error('[gemini] capacity-blocked models:', overloaded.join(' | '));
  }
  throw upstreamError(lastError.message);
}

/** Tolerant JSON extraction: strips markdown fences and salvages the outer object. */
function parseModelJson(text) {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw upstreamError('Model response was not valid JSON');
  }
}

/**
 * Cheap connectivity check for a candidate key: lists models or performs a
 * one-token generation. Used to validate a key before it is stored.
 */
export async function verifyApiKey(apiKey) {
  const probe = new GoogleGenAI({ apiKey });
  const tried = [];

  for (const model of [config.geminiModel, ...config.geminiFallbackModels]) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await probe.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        config: { maxOutputTokens: 1 }
      });
      return { ok: true, model, sample: Boolean(response?.text) };
    } catch (err) {
      tried.push(`${model}: ${extractMessage(err)}`);
      // A key that fails on every model in the chain is genuinely unusable.
      if (!/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(String(err?.message))) continue;
      return { ok: false, message: extractMessage(err) };
    }
  }

  return { ok: false, message: `No model in the chain accepted the key. ${tried.slice(0, 2).join(' | ')}` };
}

export default {
  analyzeImage,
  isGeminiConfigured,
  verifyApiKey,
  setRuntimeApiKey,
  clearRuntimeApiKey,
  keySource,
  keyHint,
  VISION_RESPONSE_SCHEMA,
  SYSTEM_INSTRUCTION
};
