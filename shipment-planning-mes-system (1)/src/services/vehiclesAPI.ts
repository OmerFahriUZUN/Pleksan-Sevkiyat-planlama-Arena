import { apiClient } from './apiClient';
import type { Vehicle, VehicleAssignment } from '../types';

export interface CreateVehicleRequest {
  plate: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight: number;
  driver_name: string;
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
}

export interface UpdateVehicleStatusRequest {
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
}

export interface VehicleResponse extends Vehicle {
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  assignments?: VehicleAssignment[];
}

export interface AvailableVehicleResponse extends VehicleResponse {}

export const vehiclesAPI = {
  getAll: async (): Promise<VehicleResponse[]> => {
    const response = await apiClient.get<VehicleResponse[]>('/vehicles');
    return response.data;
  },

  getAvailable: async (): Promise<AvailableVehicleResponse[]> => {
    const response = await apiClient.get<AvailableVehicleResponse[]>('/vehicles/available');
    return response.data;
  },

  create: async (data: CreateVehicleRequest): Promise<VehicleResponse> => {
    const response = await apiClient.post<VehicleResponse>('/vehicles', data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateVehicleStatusRequest): Promise<VehicleResponse> => {
    const response = await apiClient.patch<VehicleResponse>(`/vehicles/${id}/status`, data);
    return response.data;
  },

  getById: async (id: string): Promise<VehicleResponse> => {
    const response = await apiClient.get<VehicleResponse>(`/vehicles/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateVehicleRequest>): Promise<VehicleResponse> => {
    const response = await apiClient.patch<VehicleResponse>(`/vehicles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
