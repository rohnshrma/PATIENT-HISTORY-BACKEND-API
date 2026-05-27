/**
 * src/services/startup.service.js
 *
 * Startup responsibilities that should happen before we accept traffic.
 * For Feature 1:
 * - Ensure uploads root exists locally.
 * - Ensure uploads root is private (not auto-served as static assets).
 */

const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('../config/logger');

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    logger.info('Created directory', { directoryPath });
  }
}

function ensureUploadsRoot() {
  ensureDirectoryExists(env.UPLOAD_ROOT_ABSOLUTE);

  // Keep a marker file so humans know this directory is private.
  const markerFilePath = path.join(env.UPLOAD_ROOT_ABSOLUTE, '.private');
  if (!fs.existsSync(markerFilePath)) {
    fs.writeFileSync(
      markerFilePath,
      'This directory stores private medical files. Do not expose as static public assets.\n',
      'utf8'
    );
  }

  logger.info('Upload root ready', { uploadRoot: env.UPLOAD_ROOT_ABSOLUTE });
}

module.exports = {
  ensureUploadsRoot
};
