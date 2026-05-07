import apiClient from './client.js';

const notificationsAPI = {
  async getAll() {
    try {
      const r = await apiClient.client.get('/notifications');
      return { success: true, data: r.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async markAllRead() {
    try {
      await apiClient.client.patch('/notifications/read-all');
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
  async markRead(id) {
    try {
      await apiClient.client.patch(`/notifications/${id}/read`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || e };
    }
  },
};

export default notificationsAPI;
