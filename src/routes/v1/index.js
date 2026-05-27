/**
 * src/routes/v1/index.js
 *
 * Aggregates all v1 routes in one place.
 * As new feature route modules are built, they are mounted here.
 */

const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use(healthRoutes);

module.exports = router;
