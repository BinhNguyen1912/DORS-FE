import api from '../lib/axios';
import type { RescueTeam, PaginatedResponse } from '../types';

export const rescueTeamApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    teamType?: string;
    search?: string;
    provinceId?: number;
  }): Promise<PaginatedResponse<RescueTeam>> => {
    const response = await api.get<any>('/rescue-teams', { params });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    
    // Map items or data arrays from the paginated backend response
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

  getById: async (id: number): Promise<RescueTeam> => {
    const response = await api.get<any>(`/rescue-teams/${id}`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (data: Partial<RescueTeam>): Promise<RescueTeam> => {
    const response = await api.post<{ data: RescueTeam }>('/rescue-teams', data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<RescueTeam>
  ): Promise<RescueTeam> => {
    const response = await api.patch<{ data: RescueTeam }>(
      `/rescue-teams/${id}`,
      data
    );
    return response.data.data;
  },

  updateLocation: async (
    id: number,
    location: { lat: number; lng: number }
  ): Promise<void> => {
    await api.patch(`/rescue-teams/${id}/location`, location);
  },

  getSpecializations: async (params?: {
    teamType?: string;
    isActive?: boolean;
  }): Promise<any[]> => {
    const response = await api.get<any>('/team-specializations', { params });
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  getRecentSosRequests: async (params?: {
    provinceId?: number;
    limit?: number;
  }): Promise<any[]> => {
    const response = await api.get<any>('/sos-requests', { params });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(resData?.items)
      ? resData.items
      : Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData)
          ? resData
          : [];
  },

  updateSosStatus: async (
    id: number,
    data: { status: string; resolutionNotes?: string }
  ): Promise<any> => {
    const response = await api.patch<any>(`/sos-requests/${id}/status`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rescue-teams/${id}`);
  },

  createSpecialization: async (data: any): Promise<any> => {
    const response = await api.post<any>('/team-specializations', data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateSpecialization: async (id: number, data: any): Promise<any> => {
    const response = await api.patch<any>(`/team-specializations/${id}`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  deleteSpecialization: async (id: number): Promise<void> => {
    await api.delete(`/team-specializations/${id}`);
  },
};
