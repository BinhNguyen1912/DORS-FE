import api from '../lib/axios';
import type { Role, PaginatedResponse } from '../types';

export const roleApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    name?: string;
  }): Promise<PaginatedResponse<Role>> => {
    const response = await api.get<any>('/roles', { params });
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

  getById: async (id: number): Promise<Role> => {
    const response = await api.get<any>(`/roles/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    level: number;
    isActive: boolean;
  }): Promise<Role> => {
    const response = await api.post<any>('/roles', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  update: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response = await api.patch<any>(`/roles/${id}`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
