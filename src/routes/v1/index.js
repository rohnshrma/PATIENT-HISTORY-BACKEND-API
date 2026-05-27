/**
 * src/routes/v1/index.js
 *
 * Aggregates all v1 routes in one place.
 * As new feature route modules are built, they are mounted here.
 */

import express from 'express';
import healthRoutes from './health.routes.js';

const router = express.Router();

router.use(healthRoutes);

export default router;
