/**
 * Category Helper
 * Shared logic for finding or creating a category by name or ID.
 * Extracted from transactionController.js to eliminate duplication.
 *
 * @module utils/categoryHelper
 */

const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Resolve a category ID for a transaction or template.
 *
 * Priority order:
 *   1. Use `categoryId` directly if provided.
 *   2. Look up `categoryName` (exact match, then case-insensitive).
 *   3. Create the category if not found.
 *   4. Fall back to the global "General" category if nothing was provided.
 *
 * @param {number} userId
 * @param {number|null} categoryId   - Direct category ID (takes priority)
 * @param {string|null} categoryName - Category name to search/create
 * @returns {Promise<number|null>}    - Resolved category ID, or null
 */
async function findOrCreateCategory(userId, categoryId, categoryName) {
  // 1. Direct ID takes priority
  if (categoryId) return categoryId;

  // 2. Lookup by name
  if (categoryName) {
    // Exact match first (user-owned preferred over global)
    const exactResult = await db.query(
      `SELECT id FROM categories
       WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)
       ORDER BY user_id DESC NULLS LAST
       LIMIT 1`,
      [categoryName, userId]
    );

    if (exactResult.rows.length > 0) {
      return exactResult.rows[0].id;
    }

    // Case-insensitive fallback
    const ilikeResult = await db.query(
      `SELECT id FROM categories
       WHERE name ILIKE $1 AND (user_id = $2 OR user_id IS NULL)
       ORDER BY user_id DESC NULLS LAST
       LIMIT 1`,
      [categoryName, userId]
    );

    if (ilikeResult.rows.length > 0) {
      return ilikeResult.rows[0].id;
    }

    // Create new user-owned category
    const createResult = await db.query(
      `INSERT INTO categories (name, user_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id`,
      [categoryName, userId]
    );

    logger.info('Created new category', { userId, categoryName, categoryId: createResult.rows[0].id });
    return createResult.rows[0].id;
  }

  // 3. No ID or name provided — fall back to global "General"
  const generalResult = await db.query(
    `SELECT id FROM categories WHERE name = 'General' AND user_id IS NULL LIMIT 1`
  );

  return generalResult.rows.length > 0 ? generalResult.rows[0].id : null;
}

module.exports = { findOrCreateCategory };
