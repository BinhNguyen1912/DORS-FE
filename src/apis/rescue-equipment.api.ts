import api from '../lib/axios';

export interface RescueEquipment {
  id: number;
  teamId: number;
  name: string;
  quantity: number;
  status: 'GOOD' | 'MAINTENANCE' | 'BROKEN';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const rescueEquipmentApi = {
  getByTeamId: async (teamId: number): Promise<RescueEquipment[]> => {
    const response = await api.get<any>(`/teams/${teamId}/equipments`);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  create: async (teamId: number, data: Partial<RescueEquipment>): Promise<RescueEquipment> => {
    const response = await api.post<any>(`/teams/${teamId}/equipments`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  update: async (
    teamId: number,
    equipmentId: number,
    data: Partial<RescueEquipment>
  ): Promise<RescueEquipment> => {
    const response = await api.put<any>(`/teams/${teamId}/equipments/${equipmentId}`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  delete: async (teamId: number, equipmentId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/equipments/${equipmentId}`);
  },
};
