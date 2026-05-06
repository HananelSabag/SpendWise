/**
 * Shopping Wishlist API — /api/v1/shopping
 */

import apiClient from './client.js';

const shoppingAPI = {
  async getAll() {
    try {
      const response = await apiClient.client.get('/shopping');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error?.response?.data?.error || error };
    }
  },

  async create(data) {
    try {
      const response = await apiClient.client.post('/shopping', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error?.response?.data?.error || error };
    }
  },

  async update(id, data) {
    try {
      const response = await apiClient.client.patch(`/shopping/${id}`, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error?.response?.data?.error || error };
    }
  },

  async remove(id) {
    try {
      await apiClient.client.delete(`/shopping/${id}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.response?.data?.error || error };
    }
  },
};

export default shoppingAPI;
