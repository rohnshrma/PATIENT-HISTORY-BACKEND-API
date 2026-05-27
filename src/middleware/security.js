/**
 * src/middleware/security.js
 *
 * Builds secure baseline middleware:
 * - Helmet: secure HTTP headers
 * - CORS: origin policy
 * - Rate limiter: baseline abuse protection
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const helmetMiddleware = helmet();

const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests without an Origin header (like server-to-server or Postman).
    if (!origin) return callback(null, true);

    if (env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError('Origin is not allowed by CORS policy', 403, 'CORS_FORBIDDEN'));
  },
  credentials: true
});

const rateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next, options) {
    next(
      new AppError(
        `Too many requests. Please try again after ${Math.ceil(options.windowMs / 1000)} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware
};
