/**
 * Simple environment setup for students.
 * Read this file top-to-bottom and you will understand all app config values.
 */

import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 1) Read values from .env (or use default values).
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  UPLOAD_ROOT: process.env.UPLOAD_ROOT || 'uploads',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// 2) Validate number fields so app fails early if config is bad.
if (!Number.isFinite(env.PORT)) {
  throw new Error('PORT must be a valid number');
}
if (!Number.isFinite(env.RATE_LIMIT_WINDOW_MS)) {
  throw new Error('RATE_LIMIT_WINDOW_MS must be a valid number');
}
if (!Number.isFinite(env.RATE_LIMIT_MAX_REQUESTS)) {
  throw new Error('RATE_LIMIT_MAX_REQUESTS must be a valid number');
}

// 3) Build absolute path for local uploads directory.
env.UPLOAD_ROOT_ABSOLUTE = path.resolve(process.cwd(), env.UPLOAD_ROOT);

export default env;
