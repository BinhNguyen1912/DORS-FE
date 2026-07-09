import api from '../lib/axios';
import type { User, PaginatedResponse } from '../types';

export const userApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    provinceId?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<any>('/users', { params });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;

    const items = Array.isArray(resData?.items)
      ? resData.items
      : Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData)
          ? resData
          : [];

    const total = typeof resData?.total === 'number'
      ? resData.total
      : items.length;

    return {
      success: true,
      data: items,
      total: total,
      page: resData?.page || params?.page || 1,
      limit: resData?.limit || params?.limit || 20,
    };
  },

  search: async (query: string): Promise<User[]> => {
    const response = await api.get<any>('/users/search', { params: { q: query } });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(resData) ? resData : [];
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<any>(`/users/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.patch<any>(`/users/${id}`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateStatus: async (id: number, isActive: boolean): Promise<User> => {
    const response = await api.patch<any>(`/users/${id}/status`, { isActive });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (data: any): Promise<User> => {
    const response = await api.post<any>('/auth/admin/register', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  changePassword: async (data: { currentPassword?: string; newPassword: string }): Promise<void> => {
    await api.patch('/users/profile/password', data);
  },

  getDevices: async (): Promise<any[]> => {
    const response = await api.get<any>('/devices');
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  deleteDevice: async (id: number): Promise<void> => {
    await api.delete(`/devices/${id}`);
  },

  revokeSession: async (id: number): Promise<void> => {
    await api.delete(`/devices/session/${id}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await api.delete('/devices/all');
  },

  bulkUpdate: async (ids: number[], data: { roleId?: number; isActive?: boolean }): Promise<{ updated: number }> => {
    const response = await api.patch<any>('/users/bulk-update', { ids, ...data });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
};
