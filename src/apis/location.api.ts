import api from '../lib/axios';
import type { Province, AdministrativeUnit } from '../types';

export const locationApi = {
  getAllProvinces: async (): Promise<Province[]> => {
    const response = await api.get<{ success: boolean; data: Province[] }>('/locations/provinces');
    return response.data.data;
  },

  getWardsByProvinceId: async (provinceId: number): Promise<AdministrativeUnit[]> => {
    const response = await api.get<{ success: boolean; data: AdministrativeUnit[] }>('/locations/wards', {
      params: { provinceId },
    });
    return response.data.data;
  },

  resolveLocation: async (
    lat: number,
    lng: number
  ): Promise<{ provinceId: number; adminUnitId: number } | null> => {
    const response = await api.get<{
      success: boolean;
      data: { provinceId: number; adminUnitId: number } | null;
    }>('/locations/resolve', {
      params: { lat, lng },
    });
    return response.data.data;
  },

  geocode: async (query: string, limit: number = 6, viewbox?: string): Promise<any[]> => {
    const response = await api.get<{ success: boolean; data: any[] }>('/locations/geocode', {
      params: { q: query, limit, viewbox },
    });
    return response.data.data;
  },
};
