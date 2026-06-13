import api from '../lib/axios';
import type { DisasterEvent, PaginatedResponse } from '../types';

export const disasterApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    severity?: string;
  }): Promise<PaginatedResponse<DisasterEvent>> => {
    // Return mock empty data as the backend endpoint is not yet implemented
    return {
      success: true,
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
    };
  },

  getById: async (id: number): Promise<DisasterEvent> => {
    const response = await api.get<{ data: DisasterEvent }>(
      `/disaster-events/${id}`
    );
    return response.data.data;
  },

  create: async (data: Partial<DisasterEvent>): Promise<DisasterEvent> => {
    const response = await api.post<{ data: DisasterEvent }>(
      '/disaster-events',
      data
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<DisasterEvent>
  ): Promise<DisasterEvent> => {
    const response = await api.patch<{ data: DisasterEvent }>(
      `/disaster-events/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/disaster-events/${id}`);
  },
};
