/**
 * 🛡️ ADMIN API MODULE - Complete Admin Dashboard System
 * Features: User management, System settings, Activity logs, Statistics, Security monitoring
 * @module api/admin
 */

import { api } from './client.js';

// ✅ Admin API Module
export const adminAPI = {
  // ✅ Get Admin Dashboard Overview
  async getDashboard() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      if (!token) return { success: false, error: { code: 'NO_TOKEN' } };
      const response = await api.cachedRequest('/admin/dashboard', {
        method: 'GET'
      }, 'admin-dashboard', 2 * 60 * 1000);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: api.normalizeError(error) };
    }
  },

  // ✅ Admin Settings API (unified)
  settings: {
    // Get current system settings (optionally by category)
    async get(category = null) {
      try {
        const response = await api.client.get('/admin/settings', { params: category ? { category } : {} });
        // Server responds with { success, data, categories }
        return {
          success: true,
          data: response.data?.data || []
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get all settings or by category (cached)
    async getAll(category = null) {
      try {
        const params = category ? { category } : {};
        const cacheKey = category ? `admin-settings-${category}` : 'admin-settings-all';
        const response = await api.cachedRequest('/admin/settings', { method: 'GET', params }, cacheKey, 10 * 60 * 1000);
        return {
          success: true,
          data: response.data?.data || []
        };
      } catch (error) {
        return { success: false, error: api.normalizeError(error) };
      }
    },

    // Update system setting
    async update({ key, value, description = null, category = 'general' }) {
      try {
        const response = await api.client.put('/admin/settings', { key, value, description, category });
        // Invalidate caches
        api.clearCache('admin-settings');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: api.normalizeError(error) };
      }
    },

    // Delete a setting (super admin only)
    async delete(key) {
      try {
        const response = await api.client.delete(`/admin/settings/${key}`);
        api.clearCache('admin-settings');
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: api.normalizeError(error) };
      }
    },

    // Alias
    async getByCategory(category) {
      return this.getAll(category);
    }
  },

  // ✅ User Management APIs
  users: {
    // Get all users with pagination and filters
    async getAll(params = {}) {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = 'all',
        role = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = params;

      try {
        // Map page -> offset for server
        const offset = Math.max(0, (Number(page) - 1) * Number(limit));
        const response = await api.client.get('/admin/users', {
          params: {
            limit,
            offset,
            search,
            role,
            sortBy,
            sortOrder
          }
        });

        // ✅ FIXED: Handle the correct database response structure
        const data = response.data?.data || {};
        
        return {
          success: true,
          data: {
            users: data.users || [],
            total: data.summary?.total_users || 0,
            summary: data.summary || {},
            pagination: data.pagination || {}
          }
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Block a user
    async block(userId, reason, expiresHours = null) {
      try {
        const response = await api.client.post(`/admin/users/${userId}/manage`, {
          action: 'block',
          reason,
          expiresHours
        });

        // Clear users cache
        api.clearCache('admin-users');
        api.clearCache('admin-dashboard');

        return {
          success: true,
          message: 'User blocked successfully',
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Unblock a user
    async unblock(userId) {
      try {
        const response = await api.client.post(`/admin/users/${userId}/manage`, {
          action: 'unblock'
        });

        // Clear users cache
        api.clearCache('admin-users');
        api.clearCache('admin-dashboard');

        return {
          success: true,
          message: 'User unblocked successfully',
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Delete a user (soft delete)
    async delete(userId, reason) {
      try {
        const response = await api.client.post(`/admin/users/${userId}/manage`, {
          action: 'delete',
          reason
        });

        // Clear users cache
        api.clearCache('admin-users');
        api.clearCache('admin-dashboard');

        return {
          success: true,
          message: 'User deleted successfully',
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Verify user email
    async verifyEmail(userId) {
      try {
        const response = await api.client.post(`/admin/users/${userId}/manage`, {
          action: 'verify_email'
        });

        // Clear users cache
        api.clearCache('admin-users');

        return {
          success: true,
          message: 'User email verified successfully',
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ User Action APIs
  async blockUser(userId) {
    try {
      const response = await api.client.post(`/admin/users/${userId}/manage`, {
        action: 'block',
        reason: 'Blocked by admin'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  async unblockUser(userId) {
    try {
      const response = await api.client.post(`/admin/users/${userId}/manage`, {
        action: 'unblock'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  async deleteUser({ userId, reason } = {}) {
    try {
      const response = await api.client.post(`/admin/users/${userId}/manage`, {
        action: 'delete',
        reason
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  

  // ✅ Activity Log APIs
  activity: {
    // Get admin activity log
    async getLog(params = {}) {
      const {
        page = 1,
        limit = 100,
        adminId = null,
        actionType = null,
        startDate = null,
        endDate = null
      } = params;

      try {
        const offset = Math.max(0, (Number(page) - 1) * Number(limit));
        const response = await api.client.get('/admin/activity', {
          params: {
            limit,
            offset,
            adminId,
            actionType,
            startDate,
            endDate
          }
        });

        // Server shape: { success, data: { activities, total_count } }
        const payload = response.data?.data || {};
        const activities = payload.activities || [];
        const total = payload.total_count || 0;
        return {
          success: true,
          data: activities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get activity summary
    async getSummary(days = 7) {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const response = await this.getLog({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        });

        if (!response.success) return response;

        // Process activities into summary
        const activities = response.data;
        const summary = {
          totalActions: activities.length,
          actionTypes: {},
          adminActions: {},
          dailyActivity: {}
        };

        activities.forEach(activity => {
          // Count by action type
          summary.actionTypes[activity.action_type] = 
            (summary.actionTypes[activity.action_type] || 0) + 1;

          // Count by admin
          const adminKey = activity.admin_username || 'Unknown';
          summary.adminActions[adminKey] = 
            (summary.adminActions[adminKey] || 0) + 1;

          // Count by day
          const day = new Date(activity.created_at).toISOString().split('T')[0];
          summary.dailyActivity[day] = 
            (summary.dailyActivity[day] || 0) + 1;
        });

        return {
          success: true,
          data: summary
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ Statistics APIs
  statistics: {
    // Get comprehensive admin statistics
    async getAll() {
      try {
        const response = await api.cachedRequest('/admin/statistics', {
          method: 'GET'
        }, 'admin-statistics', 5 * 60 * 1000); // 5 minute cache

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get user statistics
    async getUsers() {
      try {
        const stats = await this.getAll();
        if (!stats.success) return stats;

        return {
          success: true,
          data: stats.data.users || {}
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get transaction statistics
    async getTransactions() {
      try {
        const stats = await this.getAll();
        if (!stats.success) return stats;

        return {
          success: true,
          data: stats.data.transactions || {}
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get system health statistics
    async getSystemHealth() {
      try {
        const stats = await this.getAll();
        if (!stats.success) return stats;

        return {
          success: true,
          data: stats.data.system || {}
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ Admin Health Check
  async healthCheck() {
    try {
      const response = await api.client.get('/admin/health');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Admin Utilities
  utils: {
    // Check if current user has admin access
    hasAdminAccess() {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      try {
        const { jwtDecode } = require('jwt-decode');
        const decoded = jwtDecode(token);
        return ['admin', 'super_admin'].includes(decoded.role);
      } catch {
        return false;
      }
    },

    // Check if current user is super admin
    isSuperAdmin() {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      try {
        const { jwtDecode } = require('jwt-decode');
        const decoded = jwtDecode(token);
        return decoded.role === 'super_admin';
      } catch {
        return false;
      }
    },

    // Format user status for display
    formatUserStatus(restrictions) {
      if (!restrictions || restrictions.length === 0) {
        return { status: 'active', label: 'Active', color: 'green' };
      }

      const activeRestrictions = restrictions.filter(r => 
        r.is_active && (!r.expires_at || new Date(r.expires_at) > new Date())
      );

      if (activeRestrictions.length === 0) {
        return { status: 'active', label: 'Active', color: 'green' };
      }

      const hasBlocked = activeRestrictions.some(r => r.restriction_type === 'blocked');
      const hasDeleted = activeRestrictions.some(r => r.restriction_type === 'deleted');

      if (hasDeleted) {
        return { status: 'deleted', label: 'Deleted', color: 'red' };
      }
      
      if (hasBlocked) {
        return { status: 'blocked', label: 'Blocked', color: 'orange' };
      }

      return { status: 'restricted', label: 'Restricted', color: 'yellow' };
    },

    // Format admin action for display
    formatAction(actionType) {
      const actionMap = {
        'view_users': 'Viewed Users',
        'block_user': 'Blocked User',
        'unblock_user': 'Unblocked User',
        'delete_user': 'Deleted User',
        'verify_email': 'Verified Email',
        'manage_settings': 'Updated Settings',
        'view_statistics': 'Viewed Statistics',
        'view_activity': 'Viewed Activity',
        'system_install': 'System Installation'
      };

      return actionMap[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    // Calculate time ago for display
    timeAgo(date) {
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return past.toLocaleDateString();
    }
  }
};

export default adminAPI; 