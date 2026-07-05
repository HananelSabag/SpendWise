/**
 * Admin Settings Controller — system_settings CRUD via admin_manage_settings()
 * @module controllers/admin/adminSettingsController
 */

const db = require('../../config/db');
const { asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const adminSettingsController = {
  /**
   * ⚙️ Get system settings
   */
  getSettings: asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { category, key } = req.query;

    try {
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3) as settings',
        [adminId, 'get', key || null],
        'admin_get_settings'
      );

      const settings = result.rows[0]?.settings;

      // Filter by category if provided
      let filteredSettings = settings;
      if (category && Array.isArray(settings)) {
        filteredSettings = settings.filter(setting => setting.category === category);
      }

      logger.info('⚙️ Admin settings accessed', {
        adminId,
        category,
        key,
        settingsCount: Array.isArray(filteredSettings) ? filteredSettings.length : 1
      });

      res.json({
        success: true,
        data: filteredSettings,
        categories: ['general', 'limits', 'system', 'auth', 'defaults', 'info', 'contact', 'legal'],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Admin get settings error', {
        adminId,
        error: error.message
      });
      throw error;
    }
  }),

  /**
   * ⚙️ Update system setting
   */
  updateSetting: asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { key, value, description, category = 'general' } = req.body;

    // Validate required fields
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Setting key and value are required'
        }
      });
    }

    try {
      // Convert to JSON text; cast to jsonb in SQL to preserve native types (bool/number/object)
      const jsonValue = JSON.stringify(value);

      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3, $4::jsonb, $5, $6) as result',
        [adminId, 'set', key, jsonValue, description, category],
        'admin_update_setting'
      );

      const updateResult = result.rows[0]?.result;

      logger.info('⚙️ Admin setting updated', {
        adminId,
        key,
        category,
        description: description ? 'provided' : 'none'
      });

      res.json({
        success: true,
        data: updateResult,
        message: `Setting '${key}' updated successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Admin update setting error', {
        adminId,
        key,
        error: error.message
      });
      throw error;
    }
  }),

  /**
   * 🗑️ Delete system setting
   */
  deleteSetting: asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { key } = req.params;

    try {
      const result = await db.query(
        'SELECT admin_manage_settings($1, $2, $3) as result',
        [adminId, 'delete', key],
        'admin_delete_setting'
      );

      const deleteResult = result.rows[0]?.result;

      logger.info('🗑️ Admin setting deleted', {
        adminId,
        key
      });

      res.json({
        success: true,
        data: deleteResult,
        message: `Setting '${key}' deleted successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Admin delete setting error', {
        adminId,
        key,
        error: error.message
      });
      throw error;
    }
  })
};

module.exports = adminSettingsController;
