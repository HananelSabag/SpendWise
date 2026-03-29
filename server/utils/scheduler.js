/**
 * 🕒 OPTIMIZED SCHEDULER SERVICE
 * Manages recurring transactions and database maintenance
 * Integrates with the new RecurringEngine for enhanced performance
 * @module utils/scheduler
 */

const cron = require('node-cron');
const RecurringEngine = require('./RecurringEngine');
const db = require('../config/db');
const logger = require('./logger');

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
    this.startupTimer = null;
    this.stats = {
      totalJobs: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRun: null,
      lastError: null
    };
  }

  /**
   * 🚀 Initialize all scheduled jobs
   */
  init() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      // ✅ FIXED: Single daily recurring job (runs at 6 AM) - no overlapping jobs
      this.scheduleJob('daily-recurring', '0 6 * * *', this.runRecurringGeneration.bind(this));
      
      // Daily token cleanup (runs at 2 AM)
      this.scheduleJob('token-cleanup', '0 2 * * *', this.runTokenCleanup.bind(this));
      
      // Weekly database maintenance (runs Saturday at 3 AM)
      this.scheduleJob('db-maintenance', '0 3 * * 6', this.runDatabaseMaintenance.bind(this));
      
      // ✅ FIXED: Startup generation with better duplicate protection
      this.startupTimer = setTimeout(async () => {
        try {
          // Only run if no recurring generation has happened in the last 6 hours
          const lastRun = this.stats.lastRun ? new Date(this.stats.lastRun) : null;
          const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
          
          if (!lastRun || lastRun < sixHoursAgo) {
            await this.runRecurringGeneration('startup');
          } else {
            logger.info('⏭️ Skipping startup recurring generation - recent run detected', {
              lastRun: lastRun.toISOString()
            });
          }
        } catch (error) {
          logger.error('❌ Startup recurring generation failed', { error: error.message });
        }
      }, 5000); // 5 second delay to ensure database is ready

      this.isInitialized = true;
      logger.info('✅ Scheduler initialized with optimized jobs', {
        jobCount: this.jobs.size,
        jobs: Array.from(this.jobs.keys())
      });

    } catch (error) {
      logger.error('❌ Scheduler initialization failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 📅 Schedule a new cron job
   */
  scheduleJob(name, cronPattern, task) {
    if (this.jobs.has(name)) {
      logger.warn(`Job ${name} already exists, replacing it`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(cronPattern, async () => {
      const start = Date.now();
      
      try {
        logger.info(`🔄 Starting scheduled job: ${name}`);
        await task(name);
        
        const duration = Date.now() - start;
        this.stats.successfulRuns++;
        this.stats.lastRun = new Date().toISOString();
        
        logger.info(`✅ Scheduled job completed: ${name}`, {
          duration: `${duration}ms`,
          totalSuccess: this.stats.successfulRuns
        });

      } catch (error) {
        const duration = Date.now() - start;
        this.stats.failedRuns++;
        this.stats.lastError = {
          job: name,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        logger.error(`❌ Scheduled job failed: ${name}`, {
          error: error.message,
          duration: `${duration}ms`,
          totalFailed: this.stats.failedRuns
        });
      }
    }, {
      scheduled: false // Don't start immediately
    });

    this.jobs.set(name, job);
    job.start();
    this.stats.totalJobs++;
    
    logger.info(`📅 Scheduled job: ${name}`, {
      cronPattern,
      totalJobs: this.stats.totalJobs
    });
  }

  /**
   * 🔄 Run recurring transaction generation with overlap protection
   */
  async runRecurringGeneration(trigger = 'scheduled') {
    // ✅ PROTECTION: Prevent overlapping executions
    if (this._recurringRunning) {
      logger.warn('⚠️ Recurring generation already running, skipping', { trigger });
      return { generated: 0, processed: 0, skipped: true };
    }
    
    this._recurringRunning = true;
    
    try {
      logger.info('🔄 Starting optimized recurring transaction generation', { trigger });
      
      const result = await RecurringEngine.generateAllRecurringTransactions();
      
      logger.info('✅ Recurring transaction generation completed', {
        ...result,
        trigger,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      logger.error('❌ Recurring transaction generation failed', {
        error: error.message,
        trigger,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      this._recurringRunning = false;
    }
  }

  /**
   * 🧹 Run token cleanup
   */
  async runTokenCleanup() {
    try {
      logger.info('🧹 Starting token cleanup');

      // Clean up expired password reset tokens
      const passwordResult = await db.query(`
        DELETE FROM password_reset_tokens 
        WHERE expires_at < NOW() OR used = TRUE
        RETURNING id
      `, [], 'cleanup_password_tokens');

      // Clean up expired email verification tokens  
      const emailResult = await db.query(`
        DELETE FROM email_verification_tokens 
        WHERE expires_at < NOW() OR used = TRUE
        RETURNING id
      `, [], 'cleanup_email_tokens');

      const passwordDeleted = passwordResult.rowCount || 0;
      const emailDeleted = emailResult.rowCount || 0;

      logger.info('✅ Token cleanup completed', {
        passwordTokensDeleted: passwordDeleted,
        emailTokensDeleted: emailDeleted,
        totalDeleted: passwordDeleted + emailDeleted
      });

      return {
        passwordTokensDeleted: passwordDeleted,
        emailTokensDeleted: emailDeleted,
        totalDeleted: passwordDeleted + emailDeleted
      };

    } catch (error) {
      logger.error('❌ Token cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 🔧 Run database maintenance
   */
  async runDatabaseMaintenance() {
    try {
      logger.info('🔧 Starting database maintenance');

      // VACUUM ANALYZE key tables for performance
      const tables = ['transactions', 'users', 'categories', 'recurring_templates'];
      const results = [];

      for (const table of tables) {
        try {
          await db.query(`VACUUM ANALYZE "${table}"`, [], `vacuum_${table}`);
          results.push({ table, status: 'success' });
          logger.info(`✅ VACUUM ANALYZE completed for ${table}`);
        } catch (error) {
          results.push({ table, status: 'failed', error: error.message });
          logger.warn(`⚠️ VACUUM ANALYZE failed for ${table}`, { error: error.message });
        }
      }

      // Update table statistics
      await db.query('ANALYZE', [], 'update_statistics');

      logger.info('✅ Database maintenance completed', {
        tables: results,
        timestamp: new Date().toISOString()
      });

      return {
        tables: results,
        totalTables: tables.length,
        successfulTables: results.filter(r => r.status === 'success').length
      };

    } catch (error) {
      logger.error('❌ Database maintenance failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ⏹️ Stop all scheduled jobs
   */
  stop() {
    try {
      // Cancel the startup delay timer if it hasn't fired yet
      if (this.startupTimer) {
        clearTimeout(this.startupTimer);
        this.startupTimer = null;
      }

      for (const [name, job] of this.jobs) {
        job.stop();
        logger.info(`⏹️ Stopped job: ${name}`);
      }

      this.jobs.clear();
      this.isInitialized = false;

      logger.info('✅ All scheduled jobs stopped');

    } catch (error) {
      logger.error('❌ Error stopping scheduled jobs', {
        error: error.message
      });
    }
  }

  /**
   * 📊 Get scheduler status and statistics
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalJobs: this.jobs.size,
      activeJobs: Array.from(this.jobs.keys()),
      stats: this.stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🎯 Manual trigger for specific jobs (for testing/debugging)
   */
  async manualTrigger(jobName) {
    try {
      switch (jobName) {
        case 'recurring':
          return await this.runRecurringGeneration('manual');
        case 'cleanup':
          return await this.runTokenCleanup();
        case 'maintenance':
          return await this.runDatabaseMaintenance();
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      logger.error(`❌ Manual trigger failed for ${jobName}`, {
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
const scheduler = new Scheduler();
module.exports = scheduler; 