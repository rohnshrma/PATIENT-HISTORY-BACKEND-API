/**
 * src/middleware/notFound.js
 *
 * Handles unmatched routes and forwards a typed 404 error to centralized
 * error middleware.
 */

const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      'ROUTE_NOT_FOUND'
    )
  );
}

module.exports = notFound;
