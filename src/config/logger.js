/**
 * Very simple logger for beginners.
 * Format: [time] [level] message {optional data}
 */

const env = require('./env');

function log(level, message, data) {
  const time = new Date().toISOString();
  if (data) {
    console.log(`[${time}] [${level}] ${message}`, data);
  } else {
    console.log(`[${time}] [${level}] ${message}`);
  }
}

module.exports = {
  info(message, data) {
    log('INFO', message, data);
  },
  warn(message, data) {
    log('WARN', message, data);
  },
  error(message, data) {
    log('ERROR', message, data);
  },
  debug(message, data) {
    if (env.NODE_ENV !== 'production') {
      log('DEBUG', message, data);
    }
  }
};
