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

// Helmet adds safer HTTP headers.
const helmetMiddleware = helmet();

// CORS decides which frontend origins can call this backend.
const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow tools like Postman (no browser origin).
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins for easy local testing.
    if (env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, allow only configured origins.
    if (env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError('Origin is not allowed by CORS policy', 403, 'CORS_FORBIDDEN'));
  },
  credentials: true
});

// Rate limiter protects from too many requests.
const rateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next) {
    next(
      new AppError(
        'Too many requests. Please try again later.',
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
