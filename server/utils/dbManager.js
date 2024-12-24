const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const dbManager = {
    async runMigrations() {
        try {
            const migrationFiles = await fs.readdir(path.join(__dirname, '../db/migrations'));
            
            for (const file of migrationFiles.sort()) {
                logger.info(`Running migration: ${file}`);
                const migration = await fs.readFile(
                    path.join(__dirname, '../db/migrations', file),
                    'utf8'
                );
                await db.query(migration);
            }
            
            logger.info('Migrations completed successfully');
        } catch (error) {
            logger.error('Migration failed:', error);
            throw error;
        }
    },

    async seedDatabase() {
        try {
            const seedFile = await fs.readFile(
                path.join(__dirname, '../db/seeds/development.sql'),
                'utf8'
            );
            await db.query(seedFile);
            logger.info('Database seeded successfully');
        } catch (error) {
            logger.error('Seeding failed:', error);
            throw error;
        }
    },

    async resetDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot reset database in production');
        }
        
        try {
            // Drop all tables and recreate
            await this.runMigrations();
            await this.seedDatabase();
            logger.info('Database reset completed');
        } catch (error) {
            logger.error('Database reset failed:', error);
            throw error;
        }
    }
};

module.exports = dbManager;