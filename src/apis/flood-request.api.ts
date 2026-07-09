import api from '../lib/axios';
import type { FloodRequest, PaginatedResponse } from '../types';

export const floodRequestApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    provinceId?: number;
    purpose?: string;
    isApprovedForMap?: boolean;
  }): Promise<PaginatedResponse<FloodRequest>> => {
    const response = await api.get<any>('/flood-requests', { params });
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
      limit: resData?.limit || params?.limit || 10,
    };
  },

  getById: async (id: number): Promise<FloodRequest> => {
    const response = await api.get<any>(`/flood-requests/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (data: Partial<FloodRequest>): Promise<FloodRequest> => {
    const response = await api.post<any>('/flood-requests', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateStatus: async (
    id: number,
    data: { status: string; reviewNotes?: string }
  ): Promise<FloodRequest> => {
    const response = await api.patch<any>(`/flood-requests/${id}/status`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  approveMap: async (id: number): Promise<FloodRequest> => {
    const response = await api.post<any>(`/flood-requests/${id}/approve-map`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  dispatch: async (
    id: number,
    data: { method: 'AUTO' | 'MANUAL'; teamId?: number | null; reviewNotes?: string }
  ): Promise<FloodRequest> => {
    const response = await api.post<any>(`/flood-requests/${id}/dispatch`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getHistory: async (id: number): Promise<any[]> => {
    const response = await api.get<any>(`/flood-requests/${id}/history`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  track: async (phone: string, id: number): Promise<FloodRequest> => {
    const response = await api.get<any>(`/flood-requests/track`, { params: { phone, id } });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
};
