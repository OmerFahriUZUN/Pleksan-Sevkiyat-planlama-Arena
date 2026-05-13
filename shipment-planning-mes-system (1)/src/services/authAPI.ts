import { apiClient } from './apiClient';
import type { AuthUser } from '../types';

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  access_token: string;
  user: AuthUser;
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  },

  register: async (data: { username: string; email: string; password: string; fullName: string; role?: string }): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/profile');
    return response.data;
  },
};