/**
 * Shopping Wishlist API — /api/v1/shopping
 */

import apiClient from './client.js';

const shoppingAPI = {
  async getAll() {
    try {
      const r = await apiClient.client.get('/shopping');
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async create(data) {
    try {
      const r = await apiClient.client.post('/shopping', data);
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async update(id, data) {
    try {
      const r = await apiClient.client.patch(`/shopping/${id}`, data);
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async remove(id) {
    try {
      await apiClient.client.delete(`/shopping/${id}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },

  // Sharing
  async invite(email) {
    try {
      const r = await apiClient.client.post('/shopping/invite', { email });
      return { success: true, data: r.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async getInvitations() {
    try {
      const r = await apiClient.client.get('/shopping/invitations');
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async respondToInvitation(token, action) {
    try {
      const r = await apiClient.client.post(`/shopping/invitations/${token}/respond`, { action });
      return { success: true, data: r.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async getMembers() {
    try {
      const r = await apiClient.client.get('/shopping/members');
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async removeMember(userId) {
    try {
      await apiClient.client.delete(`/shopping/members/${userId}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async cancelInvitation(email) {
    try {
      await apiClient.client.delete(`/shopping/invitations/${encodeURIComponent(email)}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async disband() {
    try {
      await apiClient.client.delete('/shopping/disband');
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
};

export default shoppingAPI;
