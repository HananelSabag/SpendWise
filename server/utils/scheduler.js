/**
 * Scheduler Service - Updated for recurring templates
 * Handles periodic generation of recurring transactions
 * @module utils/scheduler
 */

const cron = require('node-cron');
const db = require('../config/db');
const logger = require('./logger');

const scheduler = {
  /**
   * Initialize scheduled tasks
   */
  init() {
    logger.info('Initializing scheduler for recurring transactions');
    
    // Generate recurring transactions:
    // - On server start
    // - Every day at 00:00
    // - Every Sunday at 00:00 as backup
    
    // Run immediately on start
    this.generateRecurringTransactions();
    
    // Daily at midnight
    cron.schedule('0 0 * * *', () => {
      logger.info('Running daily recurring transactions generation');
      this.generateRecurringTransactions();
    });
    
    // Weekly backup on Sunday at midnight
    cron.schedule('0 0 * * 0', () => {
      logger.info('Running weekly backup recurring transactions generation');
      this.generateRecurringTransactions();
    });
    
    logger.info('Scheduler initialized successfully');
  },
  
  /**
   * Generate recurring transactions using SQL function
   */
  async generateRecurringTransactions() {
    const client = await db.pool.connect();
    
    try {
      logger.info('Starting recurring transactions generation...');
      
      await client.query('BEGIN');
      
      // Call the SQL function that handles all the logic
      const result = await client.query('SELECT generate_recurring_transactions()');
      
      await client.query('COMMIT');
      
      logger.info('Recurring transactions generated successfully');
      
      // Log statistics
      const stats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute') as new_count,
          COUNT(*) as total_count
        FROM (
          SELECT created_at FROM expenses WHERE template_id IS NOT NULL
          UNION ALL
          SELECT created_at FROM income WHERE template_id IS NOT NULL
        ) t
      `);
      
      logger.info('Generation stats:', {
        newTransactions: stats.rows[0].new_count,
        totalRecurring: stats.rows[0].total_count
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to generate recurring transactions:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Manual trigger for recurring generation
   * Can be called from admin endpoints
   */
  async triggerGeneration() {
    logger.info('Manual trigger for recurring transactions');
    await this.generateRecurringTransactions();
  }
};

module.exports = scheduler;