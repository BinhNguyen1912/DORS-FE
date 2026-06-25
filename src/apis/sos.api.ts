import api from '../lib/axios';
import type { SosRequest, PaginatedResponse } from '../types';

export const sosApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    provinceId?: number;
    search?: string;
  }): Promise<PaginatedResponse<SosRequest>> => {
    const response = await api.get<any>('/sos-requests', { params });
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

  getById: async (id: number): Promise<SosRequest> => {
    const response = await api.get<any>(`/sos-requests/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (data: Partial<SosRequest>): Promise<SosRequest> => {
    const response = await api.post<any>('/sos-requests', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  assignTeam: async (id: number, data?: { teamId?: number | null }): Promise<any> => {
    const response = await api.patch<any>(`/sos-requests/${id}/assign`, data || {});
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateStatus: async (
    id: number,
    data: { status: string; resolutionNotes?: string }
  ): Promise<any> => {
    const response = await api.patch<any>(`/sos-requests/${id}/status`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  delete: async (id: number, reason: string): Promise<void> => {
    await api.delete(`/sos-requests/${id}`, { data: { reason } });
  },

  getNearby: async (params: {
    lat: number;
    lng: number;
    radius?: number;
    status?: string;
  }): Promise<SosRequest[]> => {
    const response = await api.get<any>('/sos-requests/nearby', { params });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(resData) ? resData : [];
  },

  getTimeline: async (id: number): Promise<any[]> => {
    const response = await api.get<any>(`/sos-requests/${id}/timeline`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
};
