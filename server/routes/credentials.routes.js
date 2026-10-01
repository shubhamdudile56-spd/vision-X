/**
 * Runtime Gemini API key management.
 *
 * The browser posts the key once over the (HTTPS) API. The server validates it
 * against Google, holds it in process memory, and never sends it back — only a
 * masked hint. Nothing is written to disk and nothing reaches the client bundle.
 *
 * GET    /api/vision/credentials  → is a key loaded, from where, masked hint
 * PUT    /api/vision/credentials  → set/rotate the runtime key
 * DELETE /api/vision/credentials  → drop the runtime key
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest } from '../utils/errors.js';
import {
  isGeminiConfigured,
  keySource,
  keyHint,
  setRuntimeApiKey,
  clearRuntimeApiKey,
  verifyApiKey
} from '../services/gemini.service.js';
import config from '../config/env.js';

const router = express.Router();

// Key submission is tightly throttled: it is the most sensitive endpoint here.
const credentialLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API key attempts. Please wait a few minutes.' }
});

const apiKeySchema = z.object({
  api_key: z
    .string()
    .trim()
    .min(20, 'That does not look like a Gemini API key')
    .max(200, 'API key is unexpectedly long')
    // Google AI Studio keys are 39 chars starting with AIza; be permissive so
    // Vertex/Cloud keys still work, but reject obvious placeholder text.
    .refine((value) => !/\s/.test(value), 'API keys cannot contain spaces')
    .refine((value) => !/^(your|replace|test|demo|xxx)/i.test(value), 'That is a placeholder, not a real key')
});

function statusPayload() {
  return {
    configured: isGeminiConfigured(),
    source: keySource(),
    hint: keyHint(),
    model: isGeminiConfigured() ? config.geminiModel : null,
    // Tells the UI whether the operator may change the key on this deployment.
    runtime_editable: true
  };
}

router.get('/credentials', (req, res) => {
  res.json(statusPayload());
});

router.put(
  '/credentials',
  credentialLimiter,
  validate(apiKeySchema),
  asyncHandler(async (req, res) => {
    const { api_key: apiKey } = req.body;

    const check = await verifyApiKey(apiKey);
    if (!check.ok) {
      throw badRequest(`Google rejected that API key: ${check.message}`);
    }

    setRuntimeApiKey(apiKey);
    // eslint-disable-next-line no-console
    console.log('[gemini] runtime API key validated and loaded.');

    res.json({ ...statusPayload(), verified: true });
  })
);

router.delete('/credentials', (req, res) => {
  const hadRuntimeKey = keySource() === 'runtime';
  clearRuntimeApiKey();
  // eslint-disable-next-line no-console
  console.log(`[gemini] runtime API key cleared (env key ${hadRuntimeKey ? 'still active' : 'absent'}).`);
  res.json({ ...statusPayload(), cleared: hadRuntimeKey });
});

export default router;
