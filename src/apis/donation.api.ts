import api from '../lib/axios';
import type { Donation, DonationCampaign, PaginatedResponse } from '../types';

export const donationApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Donation>> => {
    // Return mock empty data as the backend endpoint is not yet implemented
    return {
      success: true,
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
    };
  },

  getById: async (id: number): Promise<Donation> => {
    const response = await api.get<{ data: Donation }>(`/donations/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Donation>): Promise<Donation> => {
    const response = await api.post<{ data: Donation }>('/donations', data);
    return response.data.data;
  },

  approve: async (id: number): Promise<Donation> => {
    const response = await api.patch<{ data: Donation }>(`/donations/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: number): Promise<Donation> => {
    const response = await api.patch<{ data: Donation }>(`/donations/${id}/reject`);
    return response.data.data;
  },

  getCampaigns: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<DonationCampaign>> => {
    const response = await api.get('/donation-campaigns', { params });
    return response.data;
  },

  createCampaign: async (
    data: Partial<DonationCampaign>
  ): Promise<DonationCampaign> => {
    const response = await api.post<{ data: DonationCampaign }>(
      '/donation-campaigns',
      data
    );
    return response.data.data;
  },
};
