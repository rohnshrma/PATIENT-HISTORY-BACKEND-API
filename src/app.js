/**
 * src/app.js
 *
 * Express application setup with secure middleware order.
 * Required order from Feature 1 flow:
 * 1) request context helper
 * 2) JSON parser
 * 3) security headers
 * 4) CORS policy
 * 5) rate limiter
 * 6) request logger
 * 7) versioned routes
 * 8) not-found handler
 * 9) centralized error handler
 */

import express from 'express';

import env from './config/env.js';
import requestContext from './middleware/requestContext.js';
import requestLogger from './middleware/requestLogger.js';
import { helmetMiddleware, corsMiddleware, rateLimitMiddleware } from './middleware/security.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import v1Routes from './routes/v1/index.js';

const app = express();

// (1) Request context
app.use(requestContext);

// (2) JSON body parser
app.use(express.json({ limit: '1mb' }));

// (3) Security headers
app.use(helmetMiddleware);

// (4) CORS policy
app.use(corsMiddleware);

// (5) Baseline rate limiter
app.use(rateLimitMiddleware);

// (6) Request logging baseline
app.use(requestLogger);

// (7) Versioned API route mount
app.use(env.API_PREFIX, v1Routes);

// (8) 404 handler
app.use(notFound);

// (9) Central error handler
app.use(errorHandler);

export default app;
