import { apiClient } from './apiClient';
import type { AuthUser } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface ProfileResponse extends AuthUser {}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  getStoredUser: (): AuthUser | null => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};
