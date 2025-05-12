/**
 * utils/scheduler.js
 * Scheduler service for handling recurring tasks like transaction generation
 */
const cron = require('node-cron');
const db = require('../config/db');
const logger = require('./logger');

/**
 * Scheduler service for running periodic tasks
 */
const scheduler = {
  /**
   * Initialize all scheduled tasks
   */
  init() {
    logger.info('Initializing scheduler');
    
    // Run recurring transactions generation:
    // - At server start (immediateRun parameter)
    // - On the 1st of each month at 00:00
    // - Every Sunday at 00:00 as a backup
    this.setupRecurringTransactionsJob(true);
    
    logger.info('Scheduler initialized successfully');
  },
  
  /**
   * Setup recurring transactions scheduler
   * @param {boolean} immediateRun - Whether to run immediately on setup
   */
  setupRecurringTransactionsJob(immediateRun = false) {
    // Schedule for 1st of each month at midnight
    cron.schedule('0 0 1 * *', () => {
      logger.info('Running scheduled monthly recurring transactions generation');
      this.generateRecurringTransactions();
    });
    
    // Backup schedule every Sunday at midnight
    cron.schedule('0 0 * * 0', () => {
      logger.info('Running scheduled weekly recurring transactions generation');
      this.generateRecurringTransactions();
    });
    
    // Run immediately on server start if requested
    if (immediateRun) {
      logger.info('Running initial recurring transactions generation');
      this.generateRecurringTransactions();
    }
  },
  
  /**
   * Generate recurring transactions by calling the database function
   */
  async generateRecurringTransactions() {
    const client = await db.pool.connect();
    try {
      logger.info('Generating recurring transactions...');
      await client.query('BEGIN');
      await client.query('SELECT generate_recurring_transactions()');
      await client.query('COMMIT');
      logger.info('Recurring transactions generated successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error generating recurring transactions:', error);
    } finally {
      client.release();
    }
  }
};

module.exports = scheduler;