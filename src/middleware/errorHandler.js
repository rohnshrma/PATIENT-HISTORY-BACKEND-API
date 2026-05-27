/**
 * src/middleware/errorHandler.js
 *
 * Centralized error responder for consistent API outputs.
 * Security behavior:
 * - In production, never leak stack traces to clients.
 * - Keep detailed diagnostics in server logs only.
 */

const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  const isKnownError = err instanceof AppError;
  const statusCode = isKnownError ? err.statusCode : 500;
  const code = isKnownError ? err.code : 'INTERNAL_ERROR';

  logger.error('Request failed', {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  const response = {
    success: false,
    error: {
      code,
      message: err.message || 'Something went wrong.'
    },
    requestId: req.context?.requestId
  };

  if (isKnownError && err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && !isKnownError) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
