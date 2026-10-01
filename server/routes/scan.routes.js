/**
 * Scan history + analytics routes (all tenant-scoped, all authenticated).
 * GET    /api/scans
 * GET    /api/scans/:id
 * POST   /api/scans
 * DELETE /api/scans/:id
 * GET    /api/analytics
 */
import express from 'express';
import { historyQuerySchema, saveScanSchema, scanIdSchema } from '../utils/schemas.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import { listScans, getScanWithObjects, deleteScan, getAnalytics, persistScan, persistenceLayer } from '../services/scan.service.js';
import { asyncHandler, notFound, serverError } from '../utils/errors.js';

const router = express.Router();

// Auth is attached per route (not router-wide) so unknown /api/* paths still
// fall through to the JSON 404 handler instead of returning 401.
router.get(
  '/scans',
  authenticateToken,
  validate(historyQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, page_size: pageSize, search, mode, source_type: sourceType } = req.validatedQuery;
    const result = await listScans({
      userId: req.user.id,
      role: req.user.role,
      page,
      pageSize,
      search,
      mode,
      sourceType
    });
    res.json(result);
  })
);

router.post(
  '/scans',
  authenticateToken,
  validate(saveScanSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const objects = payload.detected_objects ?? [];
    const highestConfidence = objects.length ? Math.max(...objects.map((obj) => obj.confidence)) : 0;

    const scanId = await persistScan({
      userId: req.user.id,
      mode: payload.mode,
      sourceType: payload.source_type,
      imageUrl: payload.image_url,
      analysis: {
        scene_category: payload.scene_category,
        scene_description: payload.scene_description,
        severity_score: payload.severity_score,
        total_objects: objects.length,
        highest_confidence: highestConfidence,
        detected_objects: objects
      }
    });

    if (!scanId) throw serverError('Could not save the scan. Please try again.');
    res.status(201).json({ scan_id: scanId, persistence: persistenceLayer() });
  })
);

router.get(
  '/scans/:id',
  authenticateToken,
  validate(scanIdSchema, 'params'),
  asyncHandler(async (req, res) => {
    const scan = await getScanWithObjects({ id: req.params.id, userId: req.user.id, role: req.user.role });
    if (!scan) throw notFound('Scan not found');
    res.json({ scan });
  })
);

router.delete(
  '/scans/:id',
  authenticateToken,
  validate(scanIdSchema, 'params'),
  asyncHandler(async (req, res) => {
    const deleted = await deleteScan({ id: req.params.id, userId: req.user.id, role: req.user.role });
    if (!deleted) throw notFound('Scan not found');
    res.json({ message: 'Scan deleted', id: req.params.id });
  })
);

router.get(
  '/analytics',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const analytics = await getAnalytics({ userId: req.user.id, role: req.user.role });
    res.json(analytics);
  })
);

export default router;
