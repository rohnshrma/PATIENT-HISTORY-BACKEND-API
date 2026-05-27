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

const express = require('express');

const env = require('./config/env');
const requestContext = require('./middleware/requestContext');
const requestLogger = require('./middleware/requestLogger');
const { helmetMiddleware, corsMiddleware, rateLimitMiddleware } = require('./middleware/security');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const v1Routes = require('./routes/v1');

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

module.exports = app;
