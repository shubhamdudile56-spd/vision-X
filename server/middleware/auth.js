/**
 * JWT authentication.
 *
 * Tokens are issued as `httpOnly` cookies (primary transport, unreadable by JS)
 * and also accepted from an `Authorization: Bearer` header for non-browser
 * clients. The user id in the token is the ONLY identity the server trusts —
 * client-supplied user ids are never honoured.
 */
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { unauthorized, forbidden } from '../utils/errors.js';

export const AUTH_COOKIE = 'visionx_token';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    // `lax` in development so the Vite proxy (same-site) and localhost work;
    // `strict` in production.
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies && typeof req.cookies[AUTH_COOKIE] === 'string' && req.cookies[AUTH_COOKIE].length > 0) {
    return req.cookies[AUTH_COOKIE];
  }
  return null;
}

function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwtSecret, (err, payload) => (err ? reject(err) : resolve(payload)));
  });
}

/** Populates `req.user` when a valid token is present; never rejects. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await verify(token);
  } catch {
    req.user = null;
  }
  return next();
}

/** Hard gate: 401 without a valid, unexpired token. */
export async function authenticateToken(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Access token required'));
  try {
    req.user = await verify(token);
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Invalid access token';
    return next(forbidden(message));
  }
}

/** Role gate, used by admin-only endpoints. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized('Access token required'));
    if (!roles.includes(req.user.role)) return next(forbidden('Insufficient permissions'));
    return next();
  };
}

export default { authenticateToken, optionalAuth, requireRole, signToken, setAuthCookie, clearAuthCookie };
