/**
 * src/server.js
 *
 * Application entrypoint.
 * - Loads env validation via config import.
 * - Ensures startup prerequisites.
 * - Starts HTTP server.
 */

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { ensureUploadsRoot } = require('./services/startup.service');

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
