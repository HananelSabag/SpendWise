const db = require('../config/db');
const logger = require('../utils/logger');

// Simple cached settings fetcher
let cache = { value: null, expiresAt: 0 };
const TTL_MS = 30 * 1000; // 30 seconds

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
    logger.warn('Maintenance flag fetch failed', { error: error.message });
    cache = { value: false, expiresAt: now + TTL_MS };
    return false;
  }
}

// Middleware: when maintenance mode is ON, block non-admins
async function maintenanceGate(req, res, next) {
  try {
    const isMaintenance = await getMaintenanceFlag();
    if (!isMaintenance) return next();

    // Always allow health and admin endpoints
    if (req.path.startsWith('/health') || req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    // Allow if authenticated admin
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
    if (isAdmin) return next();

    const accept = req.headers['accept'] || '';
    // If browser accepts HTML, redirect to a client maintenance page
    if (accept.includes('text/html')) {
      return res.redirect(302, '/maintenance');
    }
    // Fallback JSON for API clients
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


