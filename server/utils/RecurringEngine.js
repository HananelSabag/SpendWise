/**
 * OPTIMIZED Recurring Transaction Engine
 * Simplified JavaScript-based recurring logic (replacing complex SQL)
 * @module utils/RecurringEngine
 */

const { Transaction } = require('../models/Transaction');
const db = require('../config/db');
const logger = require('./logger');

class RecurringEngine {
  /**
   * 🚀 Calculate next occurrences for a template (for preview)
   */
  static calculateNextOccurrences(template, count = 3, fromDate = new Date()) {
    const occurrences = [];
    let nextDate = this.getNextOccurrenceDate(template, fromDate);
    
    for (let i = 0; i < count && nextDate; i++) {
      // Skip if date is in skip_dates array
      if (this.isDateSkipped(nextDate, template.skip_dates)) {
        nextDate = this.getNextOccurrenceDate(template, nextDate);
        continue;
      }
      
      // Check if we've passed the end date
      if (template.end_date && nextDate > new Date(template.end_date)) {
        break;
      }
      
      occurrences.push({
        date: this.formatDate(nextDate),
        amount: template.amount,
        description: template.description,
        category_id: template.category_id,
        template_id: template.id,
        estimated: true // Mark as preview/estimated
      });
      
      // Calculate next occurrence
      nextDate = this.getNextOccurrenceDate(template, nextDate);
    }
    
    return occurrences;
  }

  /**
   * 🎯 Get next occurrence date based on interval
   */
  static getNextOccurrenceDate(template, fromDate) {
    const date = new Date(fromDate);
    
    switch (template.interval_type) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
        
      case 'weekly':
        if (template.day_of_week !== null) {
          // Calculate next occurrence on specific day of week
          const currentDay = date.getDay();
          const targetDay = template.day_of_week;
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          date.setDate(date.getDate() + (daysUntilTarget || 7));
        } else {
          date.setDate(date.getDate() + 7);
        }
        break;
        
      case 'monthly':
        if (template.day_of_month !== null) {
          // Move to next month, then set the day
          date.setMonth(date.getMonth() + 1);
          const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(template.day_of_month, daysInMonth);
          date.setDate(targetDay);
        } else {
          // Simple monthly increment
          date.setMonth(date.getMonth() + 1);
        }
        break;
        
      default:
        logger.error('Invalid interval type', { 
          templateId: template.id,
          intervalType: template.interval_type 
        });
        return null;
    }
    
    return date;
  }

  /**
   * ✅ Check if a date should be skipped
   */
  static isDateSkipped(date, skipDates) {
    if (!skipDates || !Array.isArray(skipDates)) return false;
    
    const dateStr = this.formatDate(date);
    return skipDates.includes(dateStr);
  }

  /**
   * 📅 Format date for database storage
   */
  static formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * 🚀 Generate recurring transactions for all active templates
   */
  static async generateAllRecurringTransactions() {
    const start = Date.now();
    
    try {
      logger.info('🔄 Starting optimized recurring transaction generation...');
      
      // Get all active templates
      const templatesResult = await db.query(`
        SELECT * FROM recurring_templates 
        WHERE is_active = true 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY id
      `, [], 'get_active_templates');
      
      const templates = templatesResult.rows;
      
      if (templates.length === 0) {
        logger.info('✅ No active recurring templates found');
        return { generated: 0, processed: 0 };
      }
      
      let totalGenerated = 0;
      const generationEndDate = new Date();
      generationEndDate.setMonth(generationEndDate.getMonth() + 3); // 3 months ahead
      
      // Process each template
      for (const template of templates) {
        try {
          const generated = await this.generateTransactionsForTemplate(template, generationEndDate);
          totalGenerated += generated;
          
          logger.debug('✅ Template processed', {
            templateId: template.id,
            type: template.type,
            generated,
            description: template.description
          });
        } catch (error) {
          logger.error('❌ Error processing template', {
            templateId: template.id,
            error: error.message
          });
        }
      }
      
      const duration = Date.now() - start;
      logger.info('✅ Recurring generation completed', {
        templatesProcessed: templates.length,
        transactionsGenerated: totalGenerated,
        duration: `${duration}ms`,
        performance: duration < 1000 ? 'excellent' : duration < 5000 ? 'good' : 'slow'
      });
      
      return { 
        generated: totalGenerated, 
        processed: templates.length,
        duration 
      };
      
    } catch (error) {
      logger.error('❌ Recurring generation failed', {
        error: error.message,
        duration: `${Date.now() - start}ms`
      });
      throw error;
    }
  }

  /**
   * 🎯 Generate transactions for a specific template
   */
  static async generateTransactionsForTemplate(template, endDate) {
    // Find the last generated transaction for this template
    const lastResult = await db.query(`
      SELECT MAX(date) as last_date
      FROM transactions
      WHERE template_id = $1 AND deleted_at IS NULL AND type = $2
    `, [template.id, template.type], 'get_last_generated');
    
    const lastGeneratedDate = lastResult.rows[0]?.last_date;
    
    // Determine starting point
    let fromDate;
    if (lastGeneratedDate) {
      // Start from day after last generated
      fromDate = new Date(lastGeneratedDate);
      fromDate.setDate(fromDate.getDate() + 1);
    } else {
      // New template - start from template start_date
      fromDate = new Date(template.start_date);
    }
    
    // Generate transactions until end date
    const transactions = [];
    let nextDate = this.getNextOccurrenceDate(template, new Date(fromDate.getTime() - 24 * 60 * 60 * 1000)); // Subtract 1 day to get first occurrence
    
    while (nextDate && nextDate <= endDate) {
      // Check template end date
      if (template.end_date && nextDate > new Date(template.end_date)) {
        break;
      }
      
      // Skip past dates (but allow today)
      if (nextDate < new Date().setHours(0, 0, 0, 0)) {
        nextDate = this.getNextOccurrenceDate(template, nextDate);
        continue;
      }
      
      // Skip if date is in skip_dates
      if (this.isDateSkipped(nextDate, template.skip_dates)) {
        nextDate = this.getNextOccurrenceDate(template, nextDate);
        continue;
      }
      
      // Add transaction to batch
      transactions.push({
        user_id: template.user_id,
        amount: template.amount,
        description: template.description,
        date: this.formatDate(nextDate),
        category_id: template.category_id,
        template_id: template.id,
        notes: `Auto-generated from recurring template`
      });
      
      nextDate = this.getNextOccurrenceDate(template, nextDate);
    }
    
    // Batch create transactions if any
    if (transactions.length > 0) {
      // Add type to each transaction
      const transactionsWithType = transactions.map(t => ({
        ...t,
        type: template.type
      }));
      
      await Transaction.createBatch(transactionsWithType, template.user_id);
      logger.info('✅ Batch transactions created', {
        templateId: template.id,
        type: template.type,
        count: transactions.length,
        description: template.description
      });
    }
    
    return transactions.length;
  }

  /**
   * 📊 Get engine performance statistics
   */
  static getEngineStats() {
    return {
      name: 'RecurringEngine',
      version: '2.0',
      features: [
        'JavaScript-based logic',
        'Batch transaction creation',
        'Smart skip date handling',
        'Preview functionality',
        'Performance monitoring'
      ]
    };
  }
}

module.exports = RecurringEngine; 