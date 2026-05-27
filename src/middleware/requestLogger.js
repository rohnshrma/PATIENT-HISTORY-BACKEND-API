/**
 * src/middleware/requestLogger.js
 *
 * HTTP request logging baseline using Morgan.
 * We inject request-id into logs to make debugging much easier.
 */

import morgan from 'morgan';
import logger from '../config/logger.js';

morgan.token('request-id', (req) => req.context?.requestId || 'unknown');

const requestLogger = morgan(
  ':method :url :status :response-time ms - requestId=:request-id',
  {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  }
);

export default requestLogger;
