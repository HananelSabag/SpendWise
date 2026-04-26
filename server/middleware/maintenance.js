const db = require('../config/db');
const logger = require('../utils/logger');

// Cache the maintenance flag for 60s to keep this middleware off the DB hot path.
// Toggling maintenance mode now takes up to a minute to propagate — fine, this
// flag changes maybe once a year and the previous 5s TTL meant every request
// from every client paid for a DB roundtrip.
let cache = { value: null, expiresAt: 0 };
const TTL_MS = 60 * 1000;

// Public auth endpoints that must remain accessible during maintenance
const PUBLIC_AUTH_PREFIXES = [
  '/api/v1/users/login',
  '/api/v1/users/register',
  '/api/v1/users/auth/google',
  '/api/v1/users/refresh-token',
  '/api/v1/users/verify-email',
  '/api/v1/users/password-reset'
];

async function getMaintenanceFlag() {
  const now = Date.now();
  if (cache.value !== null && cache.expiresAt > now) {
    return cache.value;
  }

  try {
    const result = await db.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode' LIMIT 1`
    );
    const value = result.rows[0]?.setting_value === true || result.rows[0]?.setting_value === 'true';
    cache = { value, expiresAt: now + TTL_MS };
    return value;
  } catch (error) {
    // If the DB is unreachable we cannot know the flag — fail open and cache
    // the negative result for the full TTL so we don't hammer a dead pool.
    logger.warn('Maintenance flag fetch failed (failing open)', { error: error.message });
    cache = { value: false, expiresAt: now + TTL_MS };
    return false;
  }
}

// Middleware: when maintenance mode is ON, block non-admins.
// Returns JSON 503 with code 'MAINTENANCE_MODE' for ALL clients. The previous
// version tried to redirect HTML requests to /maintenance on the API host, but
// the API server has no such page — that route was a 404. The Vercel client
// routes itself to /maintenance when it sees this 503 code (see api/client.js).
async function maintenanceGate(req, res, next) {
  try {
    const isMaintenance = await getMaintenanceFlag();
    if (!isMaintenance) return next();

    // Always allow health and admin endpoints
    const path = req.path || '';
    if (path.startsWith('/health') || path.startsWith('/api/v1/admin')) {
      return next();
    }

    // Allow essential auth endpoints so admins can log in during maintenance
    if (PUBLIC_AUTH_PREFIXES.some(prefix => path.startsWith(prefix))) {
      return next();
    }

    // Allow if authenticated admin
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
    if (isAdmin) return next();

    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE_MODE',
        message: 'Service under maintenance. Please try again later.'
      }
    });
  } catch (error) {
    // Fail open on error
    next();
  }
}

module.exports = { maintenanceGate };


