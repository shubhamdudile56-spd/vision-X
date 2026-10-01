/**
 * Authentication routes.
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema } from '../utils/schemas.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { createUser, authenticate, getUserById, buildSession } from '../services/user.service.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

const loginAttemptLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed sign-in attempts. Please try again in a few minutes.' }
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, full_name: fullName } = req.body;
    const user = await createUser({ email, password, full_name: fullName });
    const session = await buildSession(user);
    setAuthCookie(res, session.token);
    res.status(201).json(session);
  })
);

router.post(
  '/login',
  authLimiter,
  loginAttemptLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authenticate({ email, password });
    const session = await buildSession(user);
    setAuthCookie(res, session.token);
    res.json(session);
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Signed out' });
});

router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user.id);
    if (!user) {
      // Token is cryptographically valid but the account is gone.
      clearAuthCookie(res);
      throw new HttpError(401, 'Account no longer exists');
    }
    res.json({ user });
  })
);

export default router;
