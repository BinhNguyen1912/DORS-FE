import api from '../lib/axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<any>('/auth/login', data);
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return {
      accessToken: resData?.accessToken || '',
      refreshToken: resData?.refreshToken || '',
      user: resData?.user || null,
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<any>('/auth/register', data);
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return {
      accessToken: resData?.accessToken || '',
      refreshToken: resData?.refreshToken || '',
      user: resData?.user || null,
    };
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<any>('/users/profile');
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return resData;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<any>('/auth/refresh', {
      refreshToken,
    });
    const resData = response.data?.data !== undefined ? response.data.data : response.data;
    return {
      accessToken: resData?.accessToken || '',
      refreshToken: resData?.refreshToken || '',
      user: resData?.user || null,
    };
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },
};
