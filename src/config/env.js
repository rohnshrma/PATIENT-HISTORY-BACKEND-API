/**
 * src/config/env.js
 *
 * Why this file exists:
 * - We want one single place that reads and validates environment variables.
 * - If a required variable is missing, we fail fast during startup instead of
 *   crashing later at runtime.
 *
 * Beginner note:
 * process.env contains string values only. We convert number-like values
 * ourselves so they can be used safely in code.
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function requireEnv(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return String(value).trim();
}

function toNumber(value, keyName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${keyName} must be a valid number.`);
  }
  return parsed;
}

function parseCorsOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const env = {
  NODE_ENV: requireEnv('NODE_ENV', 'development'),
  PORT: toNumber(requireEnv('PORT', '5000'), 'PORT'),
  API_PREFIX: requireEnv('API_PREFIX', '/api/v1'),
  CORS_ORIGINS: parseCorsOrigins(requireEnv('CORS_ORIGINS', 'http://localhost:3000')),
  RATE_LIMIT_WINDOW_MS: toNumber(
    requireEnv('RATE_LIMIT_WINDOW_MS', '900000'),
    'RATE_LIMIT_WINDOW_MS'
  ),
  RATE_LIMIT_MAX_REQUESTS: toNumber(
    requireEnv('RATE_LIMIT_MAX_REQUESTS', '200'),
    'RATE_LIMIT_MAX_REQUESTS'
  ),
  UPLOAD_ROOT: requireEnv('UPLOAD_ROOT', 'uploads'),
  LOG_LEVEL: requireEnv('LOG_LEVEL', 'info')
};

/**
 * We resolve upload path to an absolute path so every part of the app
 * references the same directory regardless of current working directory.
 */
env.UPLOAD_ROOT_ABSOLUTE = path.resolve(process.cwd(), env.UPLOAD_ROOT);

module.exports = env;
