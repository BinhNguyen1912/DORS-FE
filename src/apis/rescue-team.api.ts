import api from '../lib/axios';
import type { RescueTeam, PaginatedResponse } from '../types';

export const rescueTeamApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    teamType?: string;
    search?: string;
  }): Promise<PaginatedResponse<RescueTeam>> => {
    // Return mock empty data as the backend endpoint is not yet implemented
    return {
      success: true,
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
    };
  },

  getById: async (id: number): Promise<RescueTeam> => {
    const response = await api.get<{ data: RescueTeam }>(`/rescue-teams/${id}`);
    return response.data.data;
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

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rescue-teams/${id}`);
  },
};
