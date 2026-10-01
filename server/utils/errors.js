/**
 * Error primitives + centralised Express error handler.
 * Stack traces and driver messages are only surfaced outside production.
 */
import config from '../config/env.js';

export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    this.expose = true;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const conflict = (message = 'Resource already exists') => new HttpError(409, message);
export const unauthorized = (message = 'Authentication required') => new HttpError(401, message);
export const forbidden = (message = 'Access denied') => new HttpError(403, message);
export const notFound = (message = 'Resource not found') => new HttpError(404, message);
export const payloadTooLarge = (message = 'Payload too large') => new HttpError(413, message);
export const tooManyRequests = (message = 'Rate limit exceeded') => new HttpError(429, message);
export const upstreamError = (message = 'Upstream service failed') => new HttpError(502, message);
export const serverError = (message = 'Internal server error') => new HttpError(500, message);

/** Wraps an async route handler so rejections reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds the 10MB upload limit' });
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  if (err?.code === 'LIMIT_PART_COUNT' || err?.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files uploaded' });
  }

  const body = {
    error: status >= 500 && config.isProduction ? 'Internal server error' : err.message || 'Request failed'
  };

  if (err?.details && !(status >= 500 && config.isProduction)) {
    body.details = err.details;
  }
  if (!config.isProduction) {
    body.stack = err?.stack;
  }

  return res.status(status).json(body);
}

export default { HttpError, asyncHandler, notFoundHandler, errorHandler };
