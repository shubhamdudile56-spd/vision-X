/**
 * VisionX — Smart Visual Experience
 * Express API entry point.
 *
 * Security posture (OWASP-aligned):
 *  - Helmet hardened headers with a CSP tuned for the Vite dev client
 *  - Explicit CORS allow-list with credentials
 *  - httpOnly JWT cookies + Bearer support, identity always server-derived
 *  - Zod validation on every body/query/param
 *  - In-memory, magic-byte-verified uploads capped at 10MB
 *  - Tiered rate limiting (auth vs. general API vs. inference)
 *  - Production error masking
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import config from './config/env.js';
import { verifyConnection } from './db.js';
import { isGeminiConfigured, keySource, keyHint } from './services/gemini.service.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
import authRoutes from './routes/auth.routes.js';
import visionRoutes from './routes/vision.routes.js';
import scanRoutes from './routes/scan.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind a reverse proxy (Replit/Render/NGINX) so rate limiting sees real IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        // Vite dev server injects inline styles and the React refresh runtime.
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'media-src': ["'self'", 'blob:'],
        // In production the bundle is served from this origin, so 'self' plus any
        // explicitly allowed client origin is the whole requirement. WebSocket
        // schemes are only needed for the Vite HMR socket during development, and
        // allowing them in production would let a compromised script exfiltrate to
        // any host over wss://.
        'connect-src': config.isProduction
          ? ["'self'", ...config.clientOrigin]
          : ["'self'", ...config.clientOrigin, 'ws:', 'wss:'],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': config.isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: config.isProduction ? { maxAge: 15_552_000, includeSubDomains: true, preload: true } : false
  })
);

// ---------------------------------------------------------------------------
// CORS — explicit allow-list, credentials enabled
// ---------------------------------------------------------------------------
const allowedOrigins = new Set(config.clientOrigin);
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin / curl / server-to-server requests have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit', 'RateLimit-Policy'],
    maxAge: 600
  })
);

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// Baseline hardening headers not covered by Helmet defaults.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down and try again shortly.' }
});
app.use('/api/', apiLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  const db = await verifyConnection();
  res.json({
    status: 'ok',
    service: 'visionx-api',
    version: '1.0.0',
    environment: config.env,
    database: db.ok ? 'connected' : `unavailable (${db.reason})`,
    uptime_seconds: Math.round(process.uptime())
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api', scanRoutes);

// Serve the built client in production so the whole app runs from one origin.
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (config.isProduction && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
// A bind failure is an operator problem, not a crash: report it plainly and exit
// instead of dying with an unhandled 'error' event and a stack trace.
function handleServerError(err) {
  if (err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(
      `[VisionX] Port ${config.port} is already in use. Stop the other process or set PORT to a free port, then start again.`
    );
  } else if (err && err.code === 'EACCES') {
    // eslint-disable-next-line no-console
    console.error(`[VisionX] Permission denied binding port ${config.port}. Ports below 1024 need elevated privileges.`);
  } else {
    // eslint-disable-next-line no-console
    console.error('[VisionX] Failed to start the HTTP server:', err?.message ?? err);
  }
  process.exit(1);
}

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[VisionX] API listening on http://localhost:${config.port} (${config.env})`);
  // eslint-disable-next-line no-console
  console.log(`[VisionX] Allowed client origin(s): ${config.clientOrigin.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(`[VisionX] Config file: ${config.envFile ?? 'none (using process environment)'}`);

  // eslint-disable-next-line no-console
  console.log(
    isGeminiConfigured()
      ? `[VisionX] Gemini engine armed (${keySource()} key ${keyHint() ?? ''}). Model chain: ${[config.geminiModel, ...config.geminiFallbackModels].join(' → ')}`
      : '[VisionX] No Gemini API key found. Real Vision AI Mode is disabled; add a key from the in-app key panel or set GEMINI_API_KEY.'
  );

  verifyConnection().then((db) => {
    // eslint-disable-next-line no-console
    console.log(
      db.ok
        ? '[VisionX] PostgreSQL connected.'
        : `[VisionX] PostgreSQL unavailable: ${db.reason}. Analysis will still work; history will use local storage only.`
    );
  });
});

server.on('error', handleServerError);

const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n[VisionX] ${signal} received — shutting down.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[VisionX] unhandled rejection:', reason);
});

export default app;
