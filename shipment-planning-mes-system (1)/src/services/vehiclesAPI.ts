import { apiClient } from './apiClient';
import type { Vehicle } from '../types';

export const vehiclesAPI = {
  getAll: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  getAvailable: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles/available');
    return response.data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Vehicle> => {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}/status`, { status });
    return response.data;
  },

  update: async (id: string, data: any): Promise<Vehicle> => {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};