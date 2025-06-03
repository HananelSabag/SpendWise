/**
 * TimeManager - Centralized time handling
 * All date/time operations go through here
 * @module utils/TimeManager
 */

class TimeManager {
  constructor() {
    this.timezone = process.env.DEFAULT_TIMEZONE || 'Asia/Jerusalem';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Normalize any date to midnight (00:00:00.000)
   * @param {Date|string} date - Date to normalize
   * @returns {Date} Normalized date
   */
  normalize(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Format date for database (YYYY-MM-DD) - TIMEZONE SAFE
   * Uses local timezone to prevent date shifts
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatForDB(date) {
    // If date is already a string in YYYY-MM-DD format, return it as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Handle date objects or other date string formats
    const d = new Date(date);
    
    // ✅ CONFIRMED: Use local timezone methods to prevent timezone shifts
    // This ensures consistency between client, server, and database
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Client-side equivalent of formatForDB for consistency
   * @param {Date|string} date - Date to format  
   * @returns {string} Formatted date
   */
  formatForClient(date) {
    return this.formatForDB(date);
  }

  /**
   * Get date ranges for period calculations
   * @param {Date} date - Target date
   * @returns {Object} Date ranges
   */
  getDateRanges(date = new Date()) {
    const normalized = this.normalize(date);
    const cacheKey = `ranges_${normalized.getTime()}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Calculate ranges
    const ranges = {
      target: normalized,
      daily: {
        start: new Date(normalized),
        end: new Date(normalized)
      },
      weekly: {
        start: this.getWeekStart(normalized),
        end: normalized
      },
      monthly: {
        start: this.getMonthStart(normalized),
        end: normalized
      },
      yearly: {
        start: this.getYearStart(normalized),
        end: normalized
      }
    };

    // Cache result
    this.cache.set(cacheKey, {
      data: ranges,
      timestamp: Date.now()
    });

    return ranges;
  }

  /**
   * Get start of week (Sunday)
   * @param {Date} date - Target date
   * @returns {Date} Start of week
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return this.normalize(d);
  }

  /**
   * Get start of month
   * @param {Date} date - Target date
   * @returns {Date} Start of month
   */
  getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get start of year
   * @param {Date} date - Target date
   * @returns {Date} Start of year
   */
  getYearStart(date) {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * Calculate next occurrence for recurring transaction
   * @param {Date} lastDate - Last occurrence date
   * @param {string} interval - Interval type
   * @param {number} dayOfMonth - Day of month for monthly
   * @returns {Date} Next occurrence
   */
  getNextOccurrence(lastDate, interval, dayOfMonth = null) {
    const date = new Date(lastDate);
    
    switch (interval) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
        
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
        
      case 'monthly':
        if (dayOfMonth) {
          // Next month on specific day
          date.setMonth(date.getMonth() + 1);
          date.setDate(dayOfMonth);
        } else {
          // Same day next month
          date.setMonth(date.getMonth() + 1);
        }
        break;
    }
    
    return this.normalize(date);
  }

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @param {string} locale - Locale (he/en)
   * @returns {string} Formatted date
   */
  formatForDisplay(date, locale = 'he') {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString(
      locale === 'he' ? 'he-IL' : 'en-US',
      options
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
module.exports = new TimeManager();