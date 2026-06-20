import api from '../lib/axios';

export const settingsApi = {
  getSettings: async (): Promise<Record<string, string>> => {
    const response = await api.get<any>('/system-settings');
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return resData || {};
  },

  updateSettings: async (data: Record<string, string>): Promise<void> => {
    await api.patch('/system-settings', data);
  },

  getCategories: async (type: string): Promise<any[]> => {
    const response = await api.get<any>(`/system-settings/categories/${type}`);
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return resData || [];
  },

  addCategory: async (type: string, code: string, name: string): Promise<any> => {
    const response = await api.post<any>('/system-settings/categories', { type, code, name });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return resData;
  },

  deleteCategory: async (code: string): Promise<void> => {
    await api.delete(`/system-settings/categories/${code}`);
  },
};
