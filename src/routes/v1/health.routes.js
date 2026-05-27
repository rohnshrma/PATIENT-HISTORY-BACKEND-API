/**
 * src/routes/v1/health.routes.js
 *
 * Basic health endpoint under versioned API namespace.
 * This helps confirm service + routing are alive.
 */

const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Patient History Backend API is running',
    requestId: req.context?.requestId
  });
});

module.exports = router;
