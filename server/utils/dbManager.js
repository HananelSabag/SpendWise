/**
 * dbManager.js
 * Utility module for running database migrations, seeding, and full reset.
 * Updated for SpendWise project, matching the folder structure in /server/db.
 */

const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const dbManager = {
  /**
   * Runs all migration SQL files in /server/db, in sorted order.
   * Expects files named like: 01_clean_schema.sql, 02_recurring_logic.sql, etc.
   */
  async runMigrations() {
    try {
      // Only use *.sql files that look like migrations (01_xxx.sql, etc.)
      const allFiles = await fs.readdir(path.join(__dirname, '../db'));
      const migrationFiles = allFiles
        .filter(f => /^\d{2}_.*\.sql$/.test(f))
        .sort();

      for (const file of migrationFiles) {
        logger.info(`[DB] Running migration: ${file}`);
        const migration = await fs.readFile(
          path.join(__dirname, '../db', file),
          'utf8'
        );
        await db.query(migration);
      }
      logger.info('[DB] All migrations completed successfully');
    } catch (error) {
      logger.error('[DB] Migration failed:', error);
      throw error;
    }
  },

  /**
   * Seeds the database using 04_seed_data.sql in /server/db.
   */
  async seedDatabase() {
    try {
      const seedFile = await fs.readFile(
        path.join(__dirname, '../db/04_seed_data.sql'),
        'utf8'
      );
      await db.query(seedFile);
      logger.info('[DB] Database seeded successfully');
    } catch (error) {
      logger.error('[DB] Seeding failed:', error);
      throw error;
    }
  },

  /**
   * Resets the database by running all migrations and the seed file.
   * PROTECTED: Will not run if NODE_ENV is 'production'!
   */
  async resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }
    try {
      await this.runMigrations();
      await this.seedDatabase();
      logger.info('[DB] Database reset completed');
    } catch (error) {
      logger.error('[DB] Database reset failed:', error);
      throw error;
    }
  }
};

module.exports = dbManager;
