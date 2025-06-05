/**
 * Scheduler Service - Updated for recurring templates and token cleanup
 * Handles periodic generation of recurring transactions and cleanup tasks
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
    logger.info('Initializing scheduler for recurring transactions and cleanup tasks');
    
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
    
    // NEW: Daily token cleanup at 3:00 AM
    cron.schedule('0 3 * * *', () => {
      logger.info('Running daily token cleanup');
      this.cleanupExpiredTokens();
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
   * NEW: Clean up expired tokens (password reset and email verification)
   */
  async cleanupExpiredTokens() {
    const client = await db.pool.connect();
    
    try {
      logger.info('Starting token cleanup...');
      
      // Call the cleanup function we created in the database
      const result = await client.query('SELECT cleanup_expired_tokens()');
      
      // Get cleanup statistics
      const stats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM password_reset_tokens WHERE expires_at < NOW() OR used = true) as expired_password_tokens,
          (SELECT COUNT(*) FROM email_verification_tokens WHERE expires_at < NOW() OR used = true) as expired_verification_tokens
      `);
      
      logger.info('Token cleanup completed successfully', {
        expiredPasswordTokens: stats.rows[0].expired_password_tokens,
        expiredVerificationTokens: stats.rows[0].expired_verification_tokens
      });
      
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', {
        error: error.message,
        code: error.code
      });
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