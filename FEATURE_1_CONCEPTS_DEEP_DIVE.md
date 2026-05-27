# Feature 1 Explanation (Student-Friendly)

This file explains Feature 1 in simple language based on the **current code**.

## 1) What Feature 1 is

Feature 1 means: build a safe backend skeleton before business logic.

So we set up:
- clean folder structure,
- secure middleware,
- versioned API path,
- common error handling,
- env configuration,
- private local uploads folder.

## 2) Where to start reading code

Read in this order:
1. `src/server.js`
2. `src/app.js`
3. `src/routes/v1/health.routes.js`
4. `src/config/env.js`
5. `src/middleware/security.js`
6. `src/middleware/errorHandler.js`
7. `src/services/startup.service.js`

## 3) Folder structure (why it exists)

Inside `src/`:
- `config`: app settings (env, logger)
- `routes`: endpoint paths
- `controllers`: request handlers (used more in next features)
- `services`: reusable logic
- `models`: DB models (later features)
- `middleware`: request pipeline logic
- `validators`: input checks (later features)
- `utils`: helper classes like `AppError`
- `uploads`: upload-related code area

This keeps code organized and easier for students to navigate.

## 4) API Prefix and versioning

From `.env.example`:
- `API_PREFIX=/api/v1`

In `src/app.js`, all routes are mounted under this prefix.

Example:
- `GET /api/v1/health`

Why: when future breaking changes happen, we can create `/api/v2` without breaking old clients.

## 5) Middleware order (important)

In `src/app.js`, order is:
1. request context
2. JSON parser
3. helmet
4. cors
5. rate limiter
6. request logger
7. routes
8. not-found handler
9. error handler

Reason: middleware runs top-to-bottom. Wrong order can break security and debugging.

## 6) Environment variables

`src/config/env.js` does:
- load `.env` values,
- set defaults,
- convert number fields,
- validate number fields,
- build absolute upload path.

Current keys:
- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `CORS_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `UPLOAD_ROOT`
- `LOG_LEVEL`

## 7) CORS (who can call backend from browser)

In `src/middleware/security.js`:
- no `Origin` header (Postman/server-to-server) -> allowed
- development mode -> allow all origins for easy local testing
- production mode -> allow only origins in `CORS_ORIGINS`
- blocked origins -> `403` with `CORS_FORBIDDEN`

## 8) Rate limiting (basic abuse protection)

Also in `src/middleware/security.js`:
- controlled by `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- too many requests -> `429` with `RATE_LIMIT_EXCEEDED`

This protects against spam/flood requests.

## 9) Request logging

`src/middleware/requestLogger.js` + `src/config/logger.js`:
- logs method, URL, status, response time
- includes request id

This helps debugging because every request can be traced.

## 10) Request ID (`x-request-id`)

`src/middleware/requestContext.js`:
- creates a unique id per request,
- attaches it to request object,
- sends it in response header `x-request-id`.

If an error happens, this id helps find matching log lines.

## 11) Centralized error handling

Files:
- `src/utils/AppError.js`
- `src/middleware/notFound.js`
- `src/middleware/errorHandler.js`

Benefits:
- one consistent error response style,
- cleaner API behavior,
- no stack trace leak in production.

## 12) Uploads are local and private

`src/services/startup.service.js` + `src/server.js`:
- creates upload root folder at startup,
- writes `.private` marker file,
- does not expose uploads using public static route.

Why: medical files must never be publicly accessible.

## 13) Health route

`src/routes/v1/health.routes.js`:
- `GET /api/v1/health`

Used to verify server, route mounting, and middleware setup.

## 14) Feature 1 status checklist

Feature 1 requirements are satisfied:
- modular structure: yes
- versioned API base path: yes
- secure middleware baseline: yes
- centralized error handling: yes
- env contract + validation: yes
- request logging baseline: yes
- local uploads root and private access model: yes

## 15) Quick run steps

1. create `.env` from `.env.example`
2. run `npm install`
3. run `npm run dev`
4. test `GET http://localhost:5000/api/v1/health`

If health works, Feature 1 foundation is active.
