import api from '../lib/axios';

export const dashboardApi = {
  getStats: async (provinceId?: number | null) => {
    const response = await api.get('/dashboard/stats', {
      params: { provinceId: provinceId ?? undefined },
    });
    return response.data;
  },

  getCharts: async (provinceId?: number | null, days: number = 7) => {
    const response = await api.get('/dashboard/charts', {
      params: { provinceId: provinceId ?? undefined, days },
    });
    return response.data;
  },

  getAlerts: async (provinceId?: number | null) => {
    const response = await api.get('/dashboard/alerts', {
      params: { provinceId: provinceId ?? undefined },
    });
    return response.data;
  },

  getMapTasks: async (provinceId?: number | null) => {
    const response = await api.get('/dashboard/map-tasks', {
      params: { provinceId: provinceId ?? undefined },
    });
    return response.data;
  },

  getResources: async (provinceId?: number | null) => {
    const response = await api.get('/dashboard/resources', {
      params: { provinceId: provinceId ?? undefined },
    });
    return response.data;
  },
};
export default dashboardApi;
