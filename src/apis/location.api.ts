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
};
