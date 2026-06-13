import api from '../lib/axios';
import type { HouseholdProfile, PaginatedResponse } from '../types';

export const householdApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    provinceId?: number;
    search?: string;
  }): Promise<PaginatedResponse<HouseholdProfile>> => {
    // Return mock empty data as the backend endpoint is not yet implemented
    return {
      success: true,
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
    };
  },

  getById: async (id: number): Promise<HouseholdProfile> => {
    const response = await api.get<{ data: HouseholdProfile }>(
      `/household-profiles/${id}`
    );
    return response.data.data;
  },

  create: async (data: Partial<HouseholdProfile>): Promise<HouseholdProfile> => {
    const response = await api.post<{ data: HouseholdProfile }>(
      '/household-profiles',
      data
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<HouseholdProfile>
  ): Promise<HouseholdProfile> => {
    const response = await api.patch<{ data: HouseholdProfile }>(
      `/household-profiles/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/household-profiles/${id}`);
  },
};
