/**
 * Vision routes.
 *
 * POST /api/vision/analyze      – JSON (Base64 image) analysis, REAL or DEMO
 * POST /api/vision/analyze-file – multipart upload analysis
 * GET  /api/vision/status       – engine capability probe (no secrets exposed)
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { scanPayloadSchema } from '../utils/schemas.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { uploadImage, assertValidImage, MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES } from '../middleware/upload.js';
import { runVisionAnalysis } from '../services/vision.service.js';
import { isGeminiConfigured } from '../services/gemini.service.js';
import { persistScan, persistenceLayer } from '../services/scan.service.js';
import { DEMO_SCENES } from '../services/demo.service.js';
import { keyHint, keySource } from '../services/gemini.service.js';
import credentialRoutes from './credentials.routes.js';
import { asyncHandler, badRequest } from '../utils/errors.js';
import { isDatabaseEnabled } from '../db.js';
import config from '../config/env.js';

const router = express.Router();

// Runtime API key management lives under the same /api/vision namespace.
router.use(credentialRoutes);

// Inference is the expensive path — throttle it harder than plain reads.
const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Analysis rate limit exceeded. Please wait a moment before the next scan.' }
});

const base64PayloadSchema = z.string().regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, {
  message: 'image_data must be a Base64 data URL (data:image/...;base64,...)'
});

/** Decodes and validates a Base64 data URL, enforcing the same 10MB cap as uploads. */
function decodeDataUrl(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) {
    throw badRequest('image_data must be a Base64 data URL of a PNG, JPEG, or WebP image');
  }
  const [, mimeType, payload] = match;
  const buffer = Buffer.from(payload, 'base64');

  if (buffer.length === 0) throw badRequest('image_data decoded to an empty buffer');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw badRequest(`Image exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit`);
  }
  return { buffer, mimeType };
}

async function handleAnalysis(req, res, { buffer, mimeType, mode, sourceType, imageRef, sceneKey }) {
  const result = await runVisionAnalysis({ buffer, mimeType, mode, sceneKey });

  // Persist when requested. In DEMO mode the scan is stored as an explicit
  // simulated record so it can never be mistaken for real inference.
  let scanId = result.scan_id ?? null;
  let persistenceWarning = null;

  if (mode !== 'DEMO' || req.body?.persist !== false) {
    const saved = await persistScan({
      userId: req.user?.id ?? null,
      mode,
      sourceType,
      imageUrl: imageRef,
      analysis: { ...result, mode }
    });
    if (saved) {
      scanId = saved;
    } else {
      persistenceWarning = 'Scan could not be written to history.';
    }
  }

  return res.json({
    ...result,
    scan_id: scanId,
    source_type: sourceType,
    source_image_ref: imageRef,
    signed_in: Boolean(req.user),
    persistence_available: true,
    persistence: persistenceLayer(),
    ...(persistenceWarning ? { warning: persistenceWarning } : {})
  });
}

router.get('/status', (req, res) => {
  res.json({
    engine_configured: isGeminiConfigured(),
    model: isGeminiConfigured() ? config.geminiModel : null,
    key_source: keySource(),
    key_hint: keyHint(),
    database_configured: isDatabaseEnabled(),
    persistence: persistenceLayer(),
    demo_scenes: Object.values(DEMO_SCENES).map((scene) => ({ key: scene.key, label: scene.label })),
    limits: { max_upload_bytes: MAX_UPLOAD_BYTES, allowed_types: ALLOWED_MIME_TYPES }
  });
});

router.post(
  '/analyze',
  visionLimiter,
  optionalAuth,
  validate(scanPayloadSchema),
  asyncHandler(async (req, res) => {
    const { image_data: imageData, mode, source_type: sourceType, persist } = req.body;

    if (mode === 'REAL' && !isGeminiConfigured()) {
      throw badRequest(
        'Real Vision AI Mode has no Gemini API key. Add one from the "Gemini API key" panel on this page, or switch to Demo Mode.'
      );
    }

    const { buffer, mimeType } =
      mode === 'DEMO'
        ? { buffer: Buffer.alloc(0), mimeType: 'image/png' }
        : decodeDataUrl(base64PayloadSchema.parse(imageData));

    return handleAnalysis(req, res, {
      buffer,
      mimeType,
      mode,
      sourceType,
      imageRef: 'stored_in_buffer',
      sceneKey: req.body?.demo_scene
    });
  })
);

router.post(
  '/analyze-file',
  visionLimiter,
  optionalAuth,
  uploadImage,
  assertValidImage,
  asyncHandler(async (req, res) => {
    const mode = req.body?.mode === 'DEMO' ? 'DEMO' : 'REAL';
    const sourceType = req.body?.source_type === 'CAMERA' ? 'CAMERA' : 'UPLOAD';

    if (mode === 'REAL' && !isGeminiConfigured()) {
      throw badRequest(
        'Real Vision AI Mode has no Gemini API key. Add one from the "Gemini API key" panel on this page, or switch to Demo Mode.'
      );
    }

    return handleAnalysis(req, res, {
      buffer: mode === 'DEMO' ? Buffer.alloc(0) : req.file.buffer,
      mimeType: req.detectedMime,
      mode,
      sourceType,
      imageRef: `inline:${req.file.mimetype}:${req.file.size}`,
      sceneKey: req.body?.demo_scene
    });
  })
);

export default router;
