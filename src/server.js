/**
 * src/server.js
 *
 * Application entrypoint.
 * - Loads env validation via config import.
 * - Ensures startup prerequisites.
 * - Starts HTTP server.
 */

import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { ensureUploadsRoot } from './services/startup.service.js';

function startServer() {
  ensureUploadsRoot();

  app.listen(env.PORT, () => {
    logger.info('Server started', {
      environment: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX
    });
  });
}

startServer();
