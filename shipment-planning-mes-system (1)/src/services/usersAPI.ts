import { apiClient } from './apiClient';
import type { AuthUser } from '../types';

export interface UpdateUserRequest {
  role?: string;
  password?: string;
}

export interface UserResponse extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export const usersAPI = {
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>('/users');
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
    // Boş şifre göndermeyin
    const cleanData: UpdateUserRequest = {};
    if (data.role) {
      cleanData.role = data.role;
    }
    if (data.password && data.password.trim().length > 0) {
      cleanData.password = data.password;
    }
    
    const response = await apiClient.patch<UserResponse>(`/users/${id}`, cleanData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },
};