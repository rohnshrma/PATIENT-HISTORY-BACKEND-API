/**
 * src/config/logger.js
 *
 * Lightweight logger wrapper so logs look consistent and are easy to search.
 * In later features, this can be replaced with Winston/Pino without changing
 * every file.
 */

const env = require('./env');

function formatMessage(level, message, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  return JSON.stringify(payload);
}

const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message, meta) {
    if (env.NODE_ENV !== 'production') {
      console.log(formatMessage('debug', message, meta));
    }
  }
};

module.exports = logger;
