# Feature 1 Concepts Deep Dive

This file explains the backend concepts implemented in **Feature 1 (Project Foundation and Secure Skeleton)** in a beginner-friendly and practical way.

---

## 1. Why Feature 1 Exists

Feature 1 is the base layer for everything else.

If we build OTP, medical records, file access, consent, and emergency flows **without** a strong base:
- security checks get inconsistent,
- errors look different in every endpoint,
- logs become hard to trust,
- and sensitive files can accidentally become public.

So Feature 1 gives us:
- a clean project structure,
- secure default middleware,
- consistent error behavior,
- environment validation,
- and private local upload setup.

---

## 2. Folder Structure and Separation of Responsibilities

Implemented structure under `src/`:

- `config/`  
  App configuration code (environment variables, logger setup).

- `routes/`  
  API endpoints (URL handlers). In Feature 1, this includes versioned route organization.

- `controllers/`  
  Route-level request handlers (not yet deeply used in Feature 1, reserved for later features).

- `services/`  
  Business logic and startup/service-level helpers.

- `models/`  
  Database schemas/models (used in later features).

- `middleware/`  
  Reusable request/response pipeline logic (auth later, security + errors now).

- `validators/`  
  Request validation modules (used heavily in later features).

- `utils/`  
  Shared utility classes/functions (e.g., custom error class).

- `uploads/`  
  Private local storage root for sensitive files.

### Why this matters

Without separation, code turns into one giant file and becomes fragile. With separation, each layer has one job.

---

## 3. API Prefix and Versioning (`API_PREFIX`)

### What is API prefix?

An API prefix is a base path for all endpoints, such as:
- `/api/v1/health`

Here:
- `/api` = this is an API (not a web page route),
- `/v1` = version 1 contract.

### Why versioning now?

Even if only one endpoint exists today, versioning early prevents future breakage.

If later we need a breaking change, we can create `/api/v2/...` while old clients continue using `/api/v1/...`.

### Where configured

- `.env.example` has `API_PREFIX=/api/v1`
- App mounts routes using this prefix in `src/app.js`.

---

## 4. Environment Variable Contract and Validation

### What was implemented

`src/config/env.js`:
- loads `.env` using `dotenv`,
- requires important keys,
- converts numeric values safely,
- parses comma-separated CORS origins,
- computes absolute upload path.

### Why validate on startup?

Failing fast is safer than failing late.

Example:
- If `PORT` is invalid and we do not validate, app may crash unexpectedly later.
- If `UPLOAD_ROOT` is missing, file logic can break in confusing ways.

### Keys currently defined

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `CORS_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `UPLOAD_ROOT`
- `LOG_LEVEL`

---

## 5. Middleware Pipeline Order (Very Important)

Feature 1 enforced secure order in `src/app.js`:

1. request context
2. JSON parser
3. helmet
4. cors
5. rate limiter
6. request logger
7. versioned routes
8. not found handler
9. centralized error handler

### Why order matters

Middleware runs top-to-bottom. Wrong order can cause:
- missing security headers,
- untracked requests,
- inconsistent errors,
- or skipped protections.

---

## 6. Request Context (`x-request-id`)

### What it does

A unique ID is generated for each request and attached as:
- `req.context.requestId`,
- response header `x-request-id`.

### Why it matters

If user reports a problem, we can search logs by request ID and trace exactly what happened.

---

## 7. JSON Parser Baseline

### What it does

`express.json({ limit: '1mb' })`:
- reads JSON request bodies,
- rejects overly large JSON payloads.

### Why payload limit matters

Large body limits can be abused for memory pressure attacks. A sane baseline reduces abuse risk.

---

## 8. Helmet (Security Headers)

### What it is

`helmet()` sets defensive HTTP headers automatically.

### Why this matters

It helps protect against common browser-based attacks by setting secure defaults like content-type/sniffing and frame protections.

Helmet does not replace auth or consent checks, but it strengthens transport-level security posture.

---

## 9. CORS Policy

### What is CORS?

CORS controls which browser origins can call this API.

Origin example:
- `http://localhost:3000`
- `https://myfrontend.com`

### Current behavior

In `src/middleware/security.js`:
- requests with no `Origin` header are allowed (common for tools/server-to-server).
- in non-production, origins are broadly allowed to support development.
- in production, only configured `CORS_ORIGINS` are allowed.
- blocked origins get a typed `403` error (`CORS_FORBIDDEN`).

### Why this matters

Without strict production CORS, browsers from untrusted websites could call your API using a logged-in user context.

---

## 10. Rate Limiting Baseline

### What it is

Rate limiting controls how many requests a client can make in a time window.

Configured by:
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

### Current behavior

If a client exceeds the limit:
- request is blocked,
- app returns structured `429 Too Many Requests`,
- error code: `RATE_LIMIT_EXCEEDED`.

### Why this matters

Rate limits reduce:
- brute-force attempts,
- basic denial-of-service pressure,
- accidental client request floods.

In later features, limits can be tuned per endpoint sensitivity (auth/upload stricter than health checks).

---

## 11. Request Logging Baseline

### What was implemented

`morgan` is used to log:
- HTTP method,
- URL,
- status code,
- response time,
- request ID.

Logs are passed through a structured logger (`src/config/logger.js`) and printed as JSON-style entries for easier search/analysis.

### Why structured logs?

Free-text logs are hard to query. Structured logs make debugging and monitoring much easier.

---

## 12. Centralized Error Handling

### Components

- `AppError` class (`src/utils/AppError.js`)
- 404 middleware (`src/middleware/notFound.js`)
- global error middleware (`src/middleware/errorHandler.js`)

### What this gives us

- uniform response format for errors,
- stable machine-readable error codes,
- stack traces hidden in production,
- request-linked error logs for debugging.

### Error response shape

Typical structure:
- `success: false`
- `error.code`
- `error.message`
- optional `error.details`
- `requestId`

This consistency is very useful for frontend and mobile clients.

---

## 13. Upload Root (Local, Private, Not Public)

### What Feature 1 implemented

At startup (`src/services/startup.service.js`):
- ensures upload root directory exists,
- creates a `.private` marker file,
- logs initialization.

### Security intent

The uploads directory stores sensitive medical files in later phases.

So in Feature 1 we already enforce the principle:
- **uploads must exist locally**,
- **uploads must not be auto-exposed via static public serving**.

Important: The app does **not** mount uploads as `express.static(...)`. That is intentional.

### Why this matters

If files become public URLs, authentication/RBAC/consent checks can be bypassed. Later features will serve files only through secured API routes.

---

## 14. Health Route in Versioned Namespace

Implemented endpoint:
- `GET /api/v1/health`

Purpose:
- confirm backend is alive,
- verify middleware and versioned routing are wired correctly,
- provide request ID in response.

This is a safe operational endpoint used for deployment checks and debugging.

---

## 15. Security Baseline Summary (What We Have So Far)

After Feature 1, backend already has:
- secure middleware defaults,
- controlled CORS behavior,
- baseline anti-abuse rate limiting,
- consistent errors,
- request traceability with request IDs,
- private local upload root preparation,
- API versioning foundation.

What it does **not** yet have (next features):
- OTP authentication,
- JWT auth guards,
- RBAC role guards,
- consent checks,
- emergency scope checks,
- audit log persistence model.

---

## 16. Quick Run Notes

1. Create `.env` from `.env.example`.
2. Install dependencies: `npm install`
3. Start server: `npm run dev` (or `npm start`)
4. Test: `GET http://localhost:5000/api/v1/health`

Expected result:
- success response,
- `x-request-id` in headers,
- request log line in terminal,
- `uploads/` exists locally.

---

## 17. Beginner Mental Model

Think of Feature 1 as building a hospital building before admitting patients:
- structure = folders and modules,
- entrance security = middleware,
- visitor records = logging,
- incident desk = centralized errors,
- locked storage room = private uploads,
- floor numbering = API versioning.

Only after this foundation is stable should we add identity, consent, and medical record logic.
