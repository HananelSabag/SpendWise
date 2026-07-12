/**
 * 💰 TRANSACTION API - Complete Transaction Management
 * Unified API for one-time transactions and dashboard data.
 * Features: CRUD operations, Dashboard integration
 * @version 1.0.0 - FOUNDATION REPAIR
 */

import apiClient from './client.js';
import { createLogger } from '../utils/logger';
import { getAccessToken } from '../auth/tokenStorage.js';

// Create logger instance
const logger = createLogger('TransactionAPI');

/**
 * 📊 Transaction API Module
 */
const transactionAPI = {
  
  // ==========================================
  // 🔧 CORE CRUD OPERATIONS
  // ==========================================
  
  /**
   * Create a new transaction (one-time or recurring) - TIMEZONE AWARE
   * @param {string} type - 'transaction' or 'recurring'  
   * @param {Object} data - Transaction data with timezone support
   * @returns {Promise<Object>} Created transaction
   */
  async create(type = 'expense', data) {
    try {
      // ✅ FIX: Ensure proper endpoint structure for server routes
      const endpoint = `/transactions/${type}`;
      
      logger.debug(`Creating ${type} transaction`, { endpoint });
      
      const response = await apiClient.client.post(endpoint, data);
      logger.success('Transaction created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Transaction creation failed:', error.message);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get transactions with filtering and pagination
   * @param {Object} params - Query parameters (filters, pagination)
   * @returns {Promise<Object>} Transactions list
   */
  async getAll(params = {}) {
    try {
      const response = await apiClient.client.get('/transactions', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Distinct YYYY-MM months that have transactions (for the month filter).
   * @returns {Promise<Object>} { success, data: { months: ['2026-07', ...] } }
   */
  async getMonths() {
    try {
      const response = await apiClient.client.get('/transactions/months');
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Update an existing transaction - TIMEZONE AWARE
   * @param {string} type - 'transaction' or 'recurring'
   * @param {string} id - Transaction ID
   * @param {Object} data - Updated transaction data with timezone support
   * @returns {Promise<Object>} Updated transaction
   */
  async update(type, id, data) {
    try {
      const response = await apiClient.client.put(`/transactions/${type}/${id}`, data);
      logger.debug('Transaction updated', {
        transaction_datetime: response.data.data?.transaction_datetime
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Delete a transaction (soft delete)
   * @param {string} type - 'transaction' or 'recurring'
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(type, id) {
    try {
      const response = await apiClient.client.delete(`/transactions/${type}/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * 🔥 FRESH BULK DELETE - Simple and clean implementation
   * @param {Array<number>} transactionIds - Array of transaction IDs to delete
   * @returns {Promise<Object>} Bulk deletion result
   */
  async freshBulkDelete(transactionIds) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      throw new Error('Transaction IDs must be a non-empty array');
    }

    try {
      const response = await apiClient.client.post('/transactions/bulk-delete', { transactionIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==========================================
  // 📊 DASHBOARD
  // ==========================================

  /**
   * Get dashboard data: financial-period summary, category breakdown, bank
   * costs, per-institution activity, recent transactions.
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(params = {}) {
    try {
      if (!getAccessToken()) return { success: false, error: { code: 'NO_TOKEN' }, data: null };
      const response = await apiClient.client.get('/transactions/dashboard', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async getMonthlyAccounting() {
    try {
      if (!getAccessToken()) return { success: false, error: { code: 'NO_TOKEN' }, data: null };
      const response = await apiClient.client.get('/transactions/monthly-accounting');
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async getCycleRunway() {
    try {
      if (!getAccessToken()) return { success: false, error: { code: 'NO_TOKEN' }, data: null };
      const response = await apiClient.client.get('/transactions/cycle');
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async updateCycleProjection(settings) {
    try {
      if (!getAccessToken()) return { success: false, error: { code: 'NO_TOKEN' }, data: null };
      const response = await apiClient.client.put('/transactions/cycle/projection', settings);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async getSalaryCandidates() {
    try {
      const response = await apiClient.client.get('/transactions/salary-candidates');
      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async createSalarySignature(transactionId) {
    try {
      const response = await apiClient.client.post('/transactions/salary-signatures', { transactionId });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async getSalaryReview() {
    try {
      const response = await apiClient.client.get('/transactions/salary-review');
      return { success: true, data: response.data?.data || { conflicts: [] } };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async updateSalaryReview(decisions) {
    try {
      const response = await apiClient.client.put('/transactions/salary-review', { decisions });
      return { success: true, data: response.data?.data || { conflicts: [] } };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async getMerchantWatches() {
    try {
      const response = await apiClient.client.get('/transactions/merchant-watches');
      return { success: true, data: response.data?.data || { rules: [], matches: [] } };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async createMerchantWatch(rule) {
    try {
      const response = await apiClient.client.post('/transactions/merchant-watches', rule);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  async deleteMerchantWatch(ruleId) {
    try {
      const response = await apiClient.client.delete(`/transactions/merchant-watches/${ruleId}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  // NOTE: removed dead methods (0 callers, verified 2026-07-03):
  //   getSummary, getCategoryBreakdown, search, getBalanceDetails,
  //   getBalanceHistory, createExpense, createIncome — their server routes
  //   were removed in the same cleanup.
  // NOTE: removed recurring-transaction methods and the analytics dashboard
  //   alias (2026-07) — the recurring system and dedicated Analytics page
  //   were removed; see the financial-model refactor plan.
};

export default transactionAPI;
