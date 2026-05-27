/**
 * src/utils/AppError.js
 *
 * Custom operational error class.
 * - statusCode: HTTP status to return
 * - code: stable machine-readable error id
 * - details: optional extra info for client or debugging
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
