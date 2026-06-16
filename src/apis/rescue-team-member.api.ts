import api from '../lib/axios';
import type { RescueTeamMember, PaginatedResponse } from '../types';

export const rescueTeamMemberApi = {
  getMembers: async (
    teamId: number,
    params?: { isActive?: boolean }
  ): Promise<PaginatedResponse<RescueTeamMember>> => {
    const response = await api.get<any>(`/teams/${teamId}/members`, { params });
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
      page: resData?.page || 1,
      limit: resData?.limit || 10,
    };
  },

  addMember: async (
    teamId: number,
    data: {
      userId?: number;
      citizenName?: string;
      citizenPhone?: string;
      roleInTeam: 'LEADER' | 'DEPUTY_LEADER' | 'MEMBER';
      specializationIds?: number[];
    }
  ): Promise<RescueTeamMember> => {
    const response = await api.post<any>(`/teams/${teamId}/members`, data);
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  updateMemberRole: async (
    teamId: number,
    memberId: number,
    roleInTeam: 'LEADER' | 'DEPUTY_LEADER' | 'MEMBER'
  ): Promise<RescueTeamMember> => {
    const response = await api.patch<any>(
      `/teams/${teamId}/members/${memberId}/role`,
      { roleInTeam }
    );
    return response.data?.data !== undefined ? response.data.data : response.data;
  },

  removeMember: async (teamId: number, memberId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${memberId}`);
  },
};
