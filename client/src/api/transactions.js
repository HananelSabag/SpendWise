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
      console.log('🌐 Transactions API Call:', {
        url: '/transactions',
        params,
        fullUrl: `/transactions?${new URLSearchParams(params).toString()}`,
        timestamp: new Date().toISOString()
      });

      const response = await apiClient.client.get('/transactions', { params });
      
      console.log('🌐 Transactions API Response:', {
        url: '/transactions',
        params,
        responseSuccess: response?.data?.success,
        transactionCount: response?.data?.data?.transactions?.length || 0,
        firstTransactionDate: response?.data?.data?.transactions?.[0]?.date,
        lastTransactionDate: response?.data?.data?.transactions?.[response?.data?.data?.transactions?.length - 1]?.date,
        allDates: response?.data?.data?.transactions?.map(t => t.date).slice(0, 5), // First 5 dates
        timestamp: new Date().toISOString()
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('🌐 Transactions API Error:', {
        url: '/transactions',
        params,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('TransactionAPI.getAll error:', error);
      return { success: false, error: apiClient.normalizeError ? apiClient.normalizeError(error) : error };
    }
  },

  /**
   * Get recent transactions (dashboard/quick view)
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} Recent transactions
   */
  async getRecent(limit = 10) {
    try {
      const response = await apiClient.client.get('/transactions/recent', { 
        params: { limit } 
      });
      return { success: true, data: response.data };
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
      console.log('📝 Updating transaction:', { 
        type, 
        id,
        timezone: data.timezone || 'not provided',
        transaction_datetime: data.transaction_datetime || 'not provided'
      });
      
      const response = await apiClient.client.put(`/transactions/${type}/${id}`, data);
      console.log('✅ Transaction updated successfully:', {
        id: response.data.data?.id,
        transaction_datetime: response.data.data?.transaction_datetime
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Transaction update failed:', error);
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
      console.log('🔥 FRESH BULK DELETE: Starting...', {
        transactionIds,
        count: transactionIds.length,
        token: localStorage.getItem('accessToken') ? 'TOKEN_PRESENT' : 'NO_TOKEN',
        apiUrl: apiClient.client.defaults.baseURL,
        headers: apiClient.client.defaults.headers
      });

      const response = await apiClient.client.post('/transactions/bulk-delete', {
        transactionIds
      });

      console.log('✅ FRESH BULK DELETE: Success!', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ FRESH BULK DELETE: Failed!', error);
      console.error('❌ FRESH BULK DELETE: Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        request: error.request,
        message: error.message
      });
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

  // NOTE: removed dead methods (0 callers, verified 2026-07-03):
  //   getSummary, getCategoryBreakdown, search, getBalanceDetails,
  //   getBalanceHistory, createExpense, createIncome — their server routes
  //   were removed in the same cleanup.
  // NOTE: removed recurring-transaction methods and the analytics dashboard
  //   alias (2026-07) — the recurring system and dedicated Analytics page
  //   were removed; see the financial-model refactor plan.
};

export default transactionAPI; 