# VisionX — Smart Visual Experience

> **See. Understand. Experience.**

Production-grade computer vision and visual intelligence platform. Ingests live camera
frames, uploaded images, and documents; runs multi-stage visual perception through the
Google Gemini multimodal API; and returns bounding boxes, a structural severity index,
per-object risk with recommended actions, spoken narration, and a tenant-scoped audit trail.

---

## Contents

- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [The Gemini API key](#the-gemini-api-key)
- [Supabase (and other managed Postgres)](#supabase-and-other-managed-postgres)
- [API reference](#api-reference)
- [Security posture](#security-posture)
- [Verification](#verification)
- [Project layout](#project-layout)

---

## Architecture

```
┌──────────────────────────── client/ (React 18 + Vite + Tailwind) ───────────────────────────┐
│  /            landing + engine status            /live        WebRTC camera inspector      │
│  /auth        tabbed login/register               /upload      drag-drop analysis hub       │
│  /dashboard   analytics (protected)               /history     dual-layer scan archive      │
└───────────────────────────────────────────────┬──────────────────────────────────────────────┘
                    │ same-origin /api (Vite proxy in dev, Express static in prod)
┌───────────────▼──────────── server/ (Express 4, ESM) ────────────────────────────────────────┐
│  helmet · cors allow-list · rate limits · cookie-parser · production error masking          │
│                                                                                             │
│  routes/     auth · vision · credentials · scans · analytics                               │
│  middleware/ auth (JWT) · validate (Zod) · upload (multer memory + magic bytes)              │
│  services/   gemini · vision (normalisation + severity) · demo · scan · user                │
│  db.js       pg Pool, lazy, fails soft → in-memory store                                   │
│  db/         schema.sql (tables, indexes, RLS) · migrate.js · memoryStore.js                │
└───────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                    ┌───────────┴───────────┐
                          Gemini multimodal API      PostgreSQL
```

**Analysis pipeline** — every scan passes through the same five stages:

1. **Ingest** — WebRTC frame capture (downscaled to 1280px JPEG in-browser) or a validated upload.
2. **Validate** — Zod schemas on every body/query/param, plus magic-byte verification of image bytes.
3. **Infer** — Gemini returns schema-bound JSON; the response is parsed defensively.
4. **Normalise** — every field is clamped, degenerate boxes repaired, and the severity index
   recomputed server-side. Model output is never trusted as-is.
5. **Persist & present** — scan + objects written in one transaction; canvas, cards, narration,
   and JSON export rendered client-side.

---

## Quick start

Requires Node.js 20+.

```bash
npm run install:all          # installs server/ and client/ dependencies
cp server/.env.example server/.env     # Windows: copy server\.env.example server\.env
```

Fill in `JWT_SECRET` (32+ chars), then optionally `DATABASE_URL` and `GEMINI_API_KEY`.
Everything else has a working default.

```bash
npm run migrate              # apply the PostgreSQL schema (idempotent)
npm run dev                  # API on :5000, client on :5173
```

Open <http://localhost:5173>. Without an API key the app runs fully in Simulated Demo Mode.

### Production

```bash
npm run build                # builds the client into client/dist
NODE_ENV=production npm start
```

In production Express serves `client/dist` and the SPA fallback, so the whole app runs from a
single origin and no cross-site cookie is needed. Serve it over HTTPS — production cookies are
`Secure` and `SameSite=Strict`.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | API + Vite dev server together, colour-tagged output |
| `npm run dev:server` / `npm run dev:client` | One side only |
| `npm run build` | Production client bundle |
| `npm start` | Express, serving the built client when `NODE_ENV=production` |
| `npm run migrate` | Apply `server/db/schema.sql` (safe to re-run) |
| `npm run smoke` | 26-test API suite against a running server |
| `npm run lint` | ESLint over the client |

---

## Configuration

`server/.env`:

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `PORT` | no | `5000` | |
| `NODE_ENV` | no | `development` | `production` enables TLS-forced DB, `Secure` cookies, error masking, static serving |
| `DATABASE_URL` | no | — | Omit to run on the in-memory store (see below) |
| `DATABASE_SSL` | no | prod only | `require` \| `disable`. Managed providers need `require` |
| `JWT_SECRET` | **yes** | — | ≥32 chars. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `24h` | |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Comma-separate multiple. Must match the browser origin exactly |
| `GEMINI_API_KEY` | no | — | Omit for Demo Mode, or use the in-app key panel |
| `GEMINI_MODEL` | no | `gemini-3.6-flash` | |
| `GEMINI_FALLBACK_MODELS` | no | `gemini-3.8-flash,gemini-3.5-flash,gemini-3.1-flash-lite` | Tried in order on capacity errors |

`client/.env`:

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Relative is correct for dev (Vite proxy) and prod (same origin). Use an absolute origin only for a split deployment, and add it to `CLIENT_ORIGIN` |

**Precedence.** `server/.env` and the process environment can both define a variable, and the
rule depends on the runtime mode — resolved from the process environment first, then the file:

| | `NODE_ENV` / `PORT` | Everything else |
| --- | --- | --- |
| **development** | Process env wins | **`.env` wins**, with a warning on stdout when it replaces an inherited secret |
| **production** | Process env wins | Process env wins (conventional dotenv behaviour) |

The two halves exist because both defaults are wrong somewhere:

- *In development* the process environment is the surprising side. A stale `GEMINI_API_KEY`
  exported by a dev shell, or inherited from a parent process, would silently shadow whatever the
  operator had just written into `.env` — and the symptom is a "wrong key" error that looks like a
  credential problem, not a configuration one. `dotenv`'s own default (never override) is what
  causes this, so the file is allowed to win there, and the server logs exactly what it replaced.
- *In production* the process environment is the deployment surface: systemd, Docker, Kubernetes,
  PM2 and platform config panels inject `DATABASE_URL` and `GEMINI_API_KEY` there, while any `.env`
  baked into an image is a development leftover that must not win.

`NODE_ENV` and `PORT` are **deployment switches rather than project settings**, so a `.env` line can
never override them. `NODE_ENV=production npm start` has to win over a `.env` that still says
`NODE_ENV=development`; otherwise a deployed instance silently boots unhardened — no `Secure`
cookies, no error masking, no HSTS, and no static client, so the whole SPA 404s as JSON.
`PORT` behaves the same way because orchestrators assign it.

To point the API at a different config file entirely, set `ENV_FILE=/path/to/file.env`.

**No database?** If `DATABASE_URL` is absent or unreachable, accounts and scans fall back to an
in-process store so the product stays fully usable. Every response reports which layer served it
(`persistence: "postgresql" | "memory"`). Memory data is lost on restart.

---

## The Gemini API key

Real Vision AI Mode needs a Gemini key. There are two supported ways to supply it, and the UI
asks for it on every page that needs it (`/`, `/live`, `/upload`) plus a status chip in the navbar.

**1. The in-app panel (recommended).** Paste the key into the **Gemini API key** panel. It is
posted to `PUT /api/vision/credentials`, validated against Google before being stored, and held
in **server memory only** — never written to disk, never returned to the browser. `DELETE`
removes it. Useful for demos and for keeping the key out of every file.

**2. `server/.env`.** Set `GEMINI_API_KEY`. Survives restarts; still gitignored.

Either way the key never enters the Vite bundle. The browser only ever sees a masked hint
(`••••••••e10Q`) and a source label (`env` or `runtime`).

### Model selection

`gemini-2.5-flash` is **gated for new projects** — Google returns:

> `This model models/gemini-2.5-flash is no longer available to new users. Please update your
> code to use models/gemini-3.8-flash`

The 3.x flash models are also frequently capacity-blocked (`503 … high demand`). VisionX
therefore runs a **model chain**: the primary model is tried first, and a capacity error moves
to the next model instead of burning retries, because capacity errors do not clear inside a
retry window. The response reports which model actually served it.

```bash
cd server && node scripts/probe-models.js   # which models serve right now
```

---

## Supabase (and other managed Postgres)

Supabase's direct host `db.<ref>.supabase.co` is **IPv6-only**. On a host without IPv6 it fails
to resolve at all, so the IPv4 **connection pooler** is mandatory:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Use **session mode (5432)** — the migration runs DDL and multi-statement transactions, which
transaction mode (6543) rejects.

Two helpers ship with the project:

```bash
cd server
node scripts/connect-supabase.js <project-ref> <password>   # finds the region, prints the URL
node scripts/inspect-db.js                                  # tables, indexes, RLS, row counts
```

`connect-supabase.js` probes every region with a real authentication attempt. Only the pooler
that owns the project recognises the tenant (`28P01 password authentication failed`); every
other region answers `tenant/user … not found`, which is what identifies the correct region.

`npm run migrate` then creates:

- `users`, `scans`, `detected_objects` with the constraints from the schema contract
- 10 indexes covering tenant lookups, recency, severity, mode, and object joins
- Row Level Security on all three tables, with `user_self_policy`, `scan_isolation_policy`, and
  `object_isolation_policy` (applied inside a `DO` block guarded on the `auth` schema existing,
  so plain PostgreSQL skips them without erroring the migration)

The API connects as the table owner, so RLS does not gate it — tenant isolation is enforced in
application SQL (`WHERE user_id = $1`) on every single read and write. RLS is the second line of
defence for any other client that touches these tables.

---

## API reference

Base URL `/api`. All bodies are JSON and validated with Zod; errors are
`{ error, details?: [{ field, message }] }`.

### Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | 20/15min. bcrypt cost 12. 409 on duplicate email |
| `POST` | `/auth/login` | — | 10/10min per IP, successes not counted. Generic failure message |
| `POST` | `/auth/logout` | — | Clears the session cookie |
| `GET` | `/auth/me` | cookie/bearer | Current user |

### Vision

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/vision/status` | — | Engine/database state, demo scenes, limits. No secrets |
| `POST` | `/vision/analyze` | optional | Base64 data URL. `mode: REAL \| DEMO` |
| `POST` | `/vision/analyze-file` | optional | Multipart `image` + `mode` + `source_type` |
| `GET` | `/vision/credentials` | — | `{ configured, source, hint, model }` — masked only |
| `PUT` | `/vision/credentials` | — | Validates against Google, then holds in memory. 8/10min |
| `DELETE` | `/vision/credentials` | — | Drops the runtime key, falls back to env |

### Scans & analytics (all require auth)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/scans` | `page`, `page_size`, `search`, `mode`, `source_type`. Tenant-scoped |
| `POST` | `/scans` | Persists a client-supplied analysis |
| `GET` | `/scans/:id` | Scan + detected objects. `404` for another tenant's scan |
| `DELETE` | `/scans/:id` | Cascades to `detected_objects` |
| `GET` | `/analytics` | Totals, category breakdown, top objects, 14-day severity trend |
| `GET` | `/health` | Liveness + database reachability |

### Analysis response shape

```jsonc
{
  "mode": "REAL",              // or "DEMO"
  "is_simulated": false,       // true for every demo result
  "demo_notice": null,         // "[DEMO / SIMULATED MODE] …" in demo
  "model": "gemini-3.6-flash", // the model that actually served the request
  "scene_category": "Industrial Facility & Equipment",
  "scene_description": "…",
  "summary": "…",
  "severity_score": 0.412,     // 0.000–1.000, recomputed server-side
  "severity_band": { "level": "moderate", "label": "Moderate" },
  "total_objects": 12,
  "highest_confidence": 96.5,
  "unique_categories": ["Safety & EHS"],
  "detected_objects": [
    {
      "object_name": "Pressure Relief Valve",
      "category": "Industrial Inspection",
      "confidence": 96.5,      // 0–100
      "risk_score": 0.42,      // 0–1
      "recommended_action": "…",
      "bounding_box": { "x_min": 15, "y_min": 20, "x_max": 45, "y_max": 60 },
      "insight": "…"
    }
  ],
  "scan_id": "…",              // null when not persisted
  "persistence": "postgresql"  // or "memory"
}
```

### Severity index

```
severity = 0.65 × model_reported + 0.35 × (0.55 × risk_weighted_coverage + 0.45 × peak_risk)
```

Coverage is the risk-weighted, confidence-scaled fraction of the frame occupied by findings, so
both one critical defect and many minor ones move the index. The model's own judgement is
blended rather than trusted outright, and the result is clamped to `0.000–1.000`.

| Band | Range |
| --- | --- |
| Nominal | 0.00–0.15 |
| Moderate | 0.15–0.40 |
| Elevated | 0.40–0.70 |
| Critical | 0.70–1.00 |

---

## Security posture

- **Key isolation.** `GEMINI_API_KEY` and `JWT_SECRET` are server-only. The client bundle
  contains no secret; the UI only ever receives a masked hint. The credentials endpoint is
  rate-limited to 8 attempts per 10 minutes and never echoes key material back.
- **Environment files.** `.gitignore` excludes `.env`, `.env.*`, key files, and build dumps, with
  an explicit allow for `.env.example`.
- **AuthN.** `httpOnly` JWT cookie (Bearer accepted for non-browser clients), bcrypt cost 12,
  generic login failure so accounts cannot be enumerated, cookies `SameSite=Strict` + `Secure`
  in production. Identity always comes from the verified token — never from the request body.
- **AuthZ.** Every scan query is tenant-scoped in SQL; a cross-tenant read returns `404`, not
  `403`, so scan ids cannot be probed. Admins see all scans. RLS is applied as defence in depth.
- **Input validation.** Zod on every body, query, and path param, with per-field errors surfaced
  to the UI. Bounding boxes are constrained to `0–100` and non-degenerate.
- **Uploads.** Held in memory only (never written to disk), 10MB cap, MIME allow-list *plus*
  magic-byte verification of the real file signature, single file, 1:1 aspect enforced. The
  verification suite asserts no `uploads/` directory is ever created.
- **Rate limiting.** 20/15min on auth, 10/10min on failed logins, 30/min on inference, 120/min
  on the API surface.
- **Headers.** Helmet CSP tuned for the Vite client, HSTS in production, `no-referrer`,
  `nosniff`, `frame-ancestors 'none'`, and a `Permissions-Policy` limited to `camera=(self)`.
- **CORS.** Explicit origin allow-list with credentials; a disallowed origin is rejected.
- **Error masking.** Stack traces and driver messages are suppressed in production. Upstream
  Gemini errors are sanitised down to a single human-readable line — the SDK's raw `ApiError`
  JSON never reaches a client, and neither does any credential material.
- **SQL.** Parameterised queries exclusively. No string interpolation of user input.

---

## Verification

Four suites, all runnable with zero test-framework dependencies.

```bash
npm run dev                        # in one terminal

cd server
node scripts/smoke-test.js         # 26 API tests: auth, tenancy, validation, security
node scripts/verify-vision.js      # real inference + response contract
node scripts/verify-upload.js      # multipart path, magic bytes, transactional persistence
node scripts/probe-models.js       # which Gemini models are serving right now
node scripts/inspect-db.js         # live schema, indexes, RLS, row counts
```

`smoke-test.js` covers: health, engine status, malformed payloads, demo labelling, the real
response contract, non-image rejection, MIME/signature mismatch, `401`/`403` auth gates, forged
tokens, password policy, account creation and the `httpOnly` cookie, duplicate registration,
wrong-password rejection, the full analyze → list → detail → analytics → delete pipeline,
**cross-tenant isolation**, client-supplied scan persistence, out-of-range bounding box
rejection, and non-UUID path rejection.

`verify-vision.js` synthesises a PNG in-process (no fixture files), sends it through the real
pipeline, and asserts every field the UI depends on — including that all bounding boxes are
normalised and non-degenerate.

---

## Project layout

```
visionx/
├── package.json              # workspace scripts
├── scripts/dev.js            # zero-dependency API + Vite launcher
├── client/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js        # dev proxy /api → :5000
│   └── src/
│       ├── components/       # ApiKeyPanel, AnalysisPanel, AccessibilityPlayer,
│       │                     # AnalyticsChart, BoundingCanvas, DemoBadge, ErrorBanner,
│       │                     # Footer, Navbar, ObjectCard, ProtectedRoute
│       ├── context/          # AuthContext, EngineContext
│       ├── pages/            # Home, Auth, LiveVision, ImageUpload, Dashboard, History, NotFound
│       └── utils/            # api.js, format.js, localStorage.js, validation.js
└── server/
    ├── .env.example
    ├── config/env.js         # Zod-validated configuration + .env precedence
    ├── db.js                 # pg Pool, fails soft
    ├── db/
    │   ├── schema.sql        # tables, indexes, RLS policies
    │   ├── migrate.js
    │   └── memoryStore.js    # volatile fallback
    ├── middleware/           # auth.js, validate.js, upload.js
    ├── routes/               # auth, vision, credentials, scan
    ├── services/             # gemini, vision, demo, scan, user
    ├── scripts/              # smoke-test, verify-vision, verify-upload,
    │                         # probe-models, inspect-db, connect-supabase, discover-pooler
    └── server.js
```

### Notable implementation details

- **Bounding canvas** renders in device pixels and is redrawn by a `ResizeObserver`, with
  `object-contain` letterbox maths replicated so boxes align with what the user actually sees.
  Clicking a box hit-tests in the same normalised space.
- **Speech engine** chunks narration on sentence boundaries and plays a queue, because Chrome
  silently stops long utterances. Rate 0.5×–2.0×, voice selection, pause/resume/restart.
- **Object inspector** — hovering a card highlights its box on the canvas; clicking expands
  coordinates, risk, and the recommended action.
- **Guest history** lives in namespaced `localStorage` with a quota-exceeded recovery path that
  drops thumbnails from the oldest entries and retries.
- **Demo labelling** is non-negotiable: every simulated result carries `mode: "DEMO"`,
  `is_simulated: true`, a `[DEMO / SIMULATED MODE]` badge, and a stored `DEMO` mode column, so a
  recorded result can never be mistaken for live inference.
