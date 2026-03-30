/**
 * Recurring Transactions Service
 * Extracted from transactionController.js — pure helpers + DB helpers
 * for generating, calculating, and scheduling recurring transactions.
 *
 * @module services/recurringService
 */

const db = require('../config/db');
const { Transaction } = require('../models/Transaction');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Pure date-calculation helpers (no DB, fully testable)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate all recurring dates for a template within a look-ahead window.
 * Respects skip_dates, end_date, and interval_type.
 *
 * @param {Object} template - Recurring template row from DB
 * @param {Date}   fromDate      - Start of the window (usually today)
 * @param {number} daysLookAhead - How many days ahead to generate
 * @returns {Date[]}
 */
function calculateRecurringDates(template, fromDate, daysLookAhead) {
  const dates = [];
  const { interval_type, day_of_month, day_of_week, start_date, end_date, skip_dates } = template;
  const skipDatesSet = new Set(skip_dates || []);

  let currentDate = new Date(Math.max(new Date(start_date), fromDate));
  const endTime = new Date(fromDate.getTime() + (daysLookAhead * 24 * 60 * 60 * 1000));
  const finalEndDate = end_date ? new Date(Math.min(new Date(end_date), endTime)) : endTime;

  while (currentDate <= finalEndDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    if (!skipDatesSet.has(dateStr)) {
      if (interval_type === 'daily') {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval_type === 'weekly') {
        if (day_of_week === null || currentDate.getDay() === day_of_week) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval_type === 'monthly') {
        if (day_of_month === null || currentDate.getDate() === day_of_month) {
          dates.push(new Date(currentDate));
          currentDate.setMonth(currentDate.getMonth() + 1);
          if (day_of_month) {
            currentDate.setDate(day_of_month);
          }
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Safety: prevent infinite loops
    if (dates.length > 100) break;
  }

  return dates;
}

/**
 * Calculate recurring dates within a specific date range (used for current-month
 * transaction generation).
 *
 * @param {Object} template
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @returns {Date[]}
 */
function calculateRecurringDatesInRange(template, startDate, endDate) {
  const dates = [];
  const { interval_type, day_of_month, day_of_week } = template;

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    let shouldAdd = false;

    if (interval_type === 'daily') {
      shouldAdd = true;
    } else if (interval_type === 'weekly') {
      shouldAdd = (day_of_week === null || currentDate.getDay() === day_of_week);
    } else if (interval_type === 'monthly') {
      shouldAdd = (day_of_month === null || currentDate.getDate() === day_of_month);
    }

    if (shouldAdd) {
      dates.push(new Date(currentDate));
    }

    currentDate.setDate(currentDate.getDate() + 1);

    // Safety check
    if (dates.length > 50) break;
  }

  return dates;
}

/**
 * Calculate upcoming dates for next 3 months from a recurring template.
 * Handles proper weekly/monthly day alignment and skip_dates.
 *
 * @param {Object} template
 * @param {Date}   startDate - Usually today
 * @param {Date}   endDate   - Usually 3 months from today
 * @returns {Date[]}
 */
function calculateUpcomingDates(template, startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  // Respect template start_date if it's in the future
  if (template.start_date) {
    const templateStart = new Date(template.start_date);
    if (templateStart > current) {
      current.setTime(templateStart.getTime());
    }
  }

  // Align to the correct day for monthly/weekly intervals
  if (template.interval_type === 'monthly' && template.day_of_month) {
    current.setDate(template.day_of_month);
    if (current < startDate) {
      current.setMonth(current.getMonth() + 1);
    }
  } else if (template.interval_type === 'weekly' && template.day_of_week !== null) {
    const targetDay = template.day_of_week;
    const currentDay = current.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    current.setDate(current.getDate() + daysToAdd);
  }

  while (current <= endDate) {
    const dateString = current.toISOString().split('T')[0];
    if (!template.skip_dates || !template.skip_dates.includes(dateString)) {
      dates.push(new Date(current));
    }

    switch (template.interval_type) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        // Handle month-end overflow (e.g. Jan 31 → Feb 28)
        if (template.day_of_month > 28) {
          const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
          current.setDate(Math.min(template.day_of_month, lastDayOfMonth));
        }
        break;
      default:
        // Unknown interval — bail out to prevent infinite loop
        return dates;
    }
  }

  return dates;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB-dependent helpers (require mocking in tests)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate real (completed) transactions from a recurring template.
 * Looks ahead 60 days. Skips dates that already have a transaction.
 *
 * @param {Object} template - Recurring template row from DB
 * @returns {Promise<Object[]>} Array of created transaction rows
 */
async function generateTransactionsFromTemplate(template) {
  const generated = [];
  const today = new Date();
  const maxDaysLookAhead = 60;

  try {
    const dueDates = calculateRecurringDates(template, today, maxDaysLookAhead);

    for (const dueDate of dueDates) {
      const dateStr = dueDate.toISOString().split('T')[0];
      const existsResult = await db.query(
        `SELECT id FROM transactions WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL`,
        [template.id, dateStr]
      );

      if (existsResult.rows.length === 0) {
        const transactionData = {
          categoryId: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: template.notes || `Generated from recurring template: ${template.name || 'Unnamed'}`,
          date: dateStr,
          templateId: template.id,
          timezone: template.timezone || 'UTC',
          time: template.preferred_time || '09:00',
          transaction_datetime: new Date(`${dateStr}T${template.preferred_time || '09:00'}:00`).toISOString()
        };

        logger.info('Creating transaction from template', {
          templateId: template.id,
          userId: template.user_id,
          transactionData: { type: transactionData.type, amount: transactionData.amount, date: transactionData.date }
        });

        const created = await Transaction.create(transactionData, template.user_id);
        logger.info('Transaction created successfully from template', { templateId: template.id, transactionId: created.id });
        generated.push(created);
      }
    }

    return generated;
  } catch (error) {
    logger.error('Failed to generate transactions from template', { templateId: template.id, error: error.message });
    throw error;
  }
}

/**
 * Generate current-month transactions for a template (status = completed).
 * Used during onboarding to backfill the current month.
 *
 * @param {Object} template
 * @param {Date}   startDate - Usually first day of current month
 * @param {Date}   endDate   - Usually today
 * @returns {Promise<Object[]>}
 */
async function generateCurrentMonthTransactions(template, startDate, endDate) {
  const currentTransactions = [];

  try {
    const currentDates = calculateRecurringDatesInRange(template, startDate, endDate);

    for (const dueDate of currentDates) {
      const dateStr = dueDate.toISOString().split('T')[0];
      const existsResult = await db.query(
        `SELECT id FROM transactions WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL`,
        [template.id, dateStr]
      );

      if (existsResult.rows.length === 0) {
        const transactionData = {
          categoryId: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Generated from recurring template: ${template.name}`,
          date: dateStr,
          templateId: template.id,
          timezone: template.timezone || 'UTC',
          time: template.preferred_time || '09:00',
          transaction_datetime: new Date(`${dateStr}T${template.preferred_time || '09:00'}:00`).toISOString()
        };

        const created = await Transaction.create(transactionData, template.user_id);
        currentTransactions.push(created);
      }
    }

    return currentTransactions;
  } catch (error) {
    logger.error('Failed to generate current month transactions', { templateId: template.id, error: error.message });
    return [];
  }
}

/**
 * Generate virtual upcoming transactions for a template (next 3 months).
 * These are NOT stored in the DB — they are returned as virtual objects for UI display.
 *
 * @param {Object} template
 * @returns {Promise<Object[]>}
 */
async function generateUpcomingTransactions(template) {
  const upcomingTransactions = [];
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  try {
    const upcomingDates = calculateUpcomingDates(template, today, threeMonthsFromNow);

    for (const dueDate of upcomingDates) {
      const dateStr = dueDate.toISOString().split('T')[0];
      const existsResult = await db.query(
        `SELECT id FROM transactions WHERE template_id = $1 AND date = $2 AND deleted_at IS NULL`,
        [template.id, dateStr]
      );

      if (existsResult.rows.length === 0) {
        upcomingTransactions.push({
          id: `upcoming_${template.id}_${dateStr}`,
          user_id: template.user_id,
          category_id: template.category_id,
          amount: template.amount,
          type: template.type,
          description: template.description || template.name,
          notes: `Upcoming: ${template.name || 'Recurring Transaction'}`,
          date: dateStr,
          template_id: template.id,
          status: 'upcoming',
          created_at: new Date().toISOString(),
          is_virtual: true
        });
      }
    }

    return upcomingTransactions;
  } catch (error) {
    logger.error('Failed to generate upcoming transactions', { templateId: template.id, error: error.message });
    return [];
  }
}

module.exports = {
  calculateRecurringDates,
  calculateRecurringDatesInRange,
  calculateUpcomingDates,
  generateTransactionsFromTemplate,
  generateCurrentMonthTransactions,
  generateUpcomingTransactions
};
