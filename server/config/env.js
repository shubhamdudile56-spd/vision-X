/**
 * Centralised, validated runtime configuration.
 * Every secret is read from the process environment only — nothing is ever
 * exposed to the client bundle.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Resolve .env relative to the server package, not the shell's cwd, so the API
// boots identically from the repo root, from `server/`, or under a supervisor.
const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');
const envPath = process.env.ENV_FILE
  ? path.resolve(process.env.ENV_FILE)
  : path.join(serverRoot, '.env');

// Snapshot the inherited environment so we can warn when a host-exported
// variable is being replaced by the .env file (a common and silent surprise).
const inheritedEnv = { ...process.env };

// NODE_ENV and PORT are deployment switches, not project settings: systemd,
// Docker, PM2, `cross-env NODE_ENV=production npm start` and platform config
// panels all inject them. A `.env` line must never be able to force a deployed
// instance back to development mode (that would silently drop TLS-only cookies,
// error masking, HSTS and the static client) or away from an assigned port.
const PROCESS_AUTHORITATIVE = new Set(['NODE_ENV', 'PORT']);

// Resolve the runtime mode first: it decides the precedence rule for everything else.
const runtimeEnv = (process.env.NODE_ENV ?? '').trim();
const fileEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const isProductionRuntime =
  (PROCESS_AUTHORITATIVE.has('NODE_ENV') ? runtimeEnv : fileEnv.NODE_ENV ?? runtimeEnv ?? '')
    .trim()
    .toLowerCase() === 'production';

if (Object.keys(fileEnv).length > 0) {
  for (const [key, value] of Object.entries(fileEnv)) {
    // Deployment switches always defer to the process environment when it has an opinion.
    if (PROCESS_AUTHORITATIVE.has(key)) {
      if (inheritedEnv[key] !== undefined) continue;
      process.env[key] = value;
      continue;
    }

    // In production the process environment is the deployment surface (orchestrators
    // inject DATABASE_URL / GEMINI_API_KEY there, and any `.env` shipped in the image is
    // a development leftover), so it wins — the conventional dotenv rule.
    if (isProductionRuntime && inheritedEnv[key] !== undefined) continue;

    // In development an explicit `.env` entry wins instead, because the process
    // environment is the surprising one there: a stale GEMINI_API_KEY exported by a dev
    // shell or inherited from a parent process would otherwise shadow whatever the
    // operator just wrote into `.env`, with no way to tell from the symptom.
    if (
      !isProductionRuntime &&
      inheritedEnv[key] !== undefined &&
      inheritedEnv[key] !== value &&
      /KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL/.test(key)
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[VisionX] ${key} was already set in this process environment and has been overridden by ${envPath}.`
      );
    }
    process.env[key] = value;
  }
}

/** Treats an empty env var the same as an unset one. */
const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  DATABASE_URL: optionalString,
  // Managed providers (Supabase, Neon, Render) require TLS even in
  // development. `require` forces it; `disable` is for a local socket or a
  // trusted network; unset means "TLS in production only".
  DATABASE_SSL: z.enum(['require', 'disable']).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(2).default('24h'),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default('gemini-3.6-flash'),
  // Comma-separated fallbacks tried in order when the primary model is
  // capacity-blocked (503 "high demand") or otherwise unavailable.
  GEMINI_FALLBACK_MODELS: z.string().default('gemini-3.8-flash,gemini-3.5-flash,gemini-3.1-flash-lite')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[VisionX] Invalid environment configuration:\n${issues}\n\nCopy server/.env.example to server/.env and fill in the values.\n`);
  process.exit(1);
}

const raw = parsed.data;

export const config = {
  env: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  port: raw.PORT,
  envFile: fs.existsSync(envPath) ? envPath : null,
  databaseUrl: raw.DATABASE_URL ?? null,
  databaseSsl: raw.DATABASE_SSL ?? null,
  jwtSecret: raw.JWT_SECRET,
  jwtExpiresIn: raw.JWT_EXPIRES_IN,
  clientOrigin: raw.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  geminiApiKey: raw.GEMINI_API_KEY ?? null,
  geminiModel: raw.GEMINI_MODEL,
  geminiFallbackModels: raw.GEMINI_FALLBACK_MODELS.split(',')
    .map((model) => model.trim())
    .filter(Boolean)
    .filter((model) => model !== raw.GEMINI_MODEL)
};

export default config;
