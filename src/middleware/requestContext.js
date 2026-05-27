/**
 * src/middleware/requestContext.js
 *
 * Adds a request id and timing metadata to every request.
 * This helps correlate request logs with error logs.
 */

import crypto from 'crypto';

function requestContext(req, res, next) {
  req.context = {
    requestId: crypto.randomUUID(),
    startedAt: Date.now()
  };

  res.setHeader('x-request-id', req.context.requestId);
  next();
}

export default requestContext;
