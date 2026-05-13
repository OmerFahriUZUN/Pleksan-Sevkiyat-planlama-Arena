import { apiClient } from './apiClient';
import type { Personnel } from '../types';

export const personnelAPI = {
  getAll: async (): Promise<Personnel[]> => {
    const response = await apiClient.get<Personnel[]>('/personnel');
    return response.data;
  },

  getByRole: async (role: string): Promise<Personnel[]> => {
    const response = await apiClient.get<Personnel[]>(`/personnel/role/${role}`);
    return response.data;
  },

  getById: async (id: string): Promise<Personnel> => {
    const response = await apiClient.get<Personnel>(`/personnel/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Personnel> => {
    const response = await apiClient.post<Personnel>('/personnel', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Personnel> => {
    const response = await apiClient.patch<Personnel>(`/personnel/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/personnel/${id}`);
  },

  checkShift: async (id: string, saat: string): Promise<{ personel_id: string; saat: string; vardiyada: boolean }> => {
    const response = await apiClient.get(`/personnel/${id}/check-shift/${saat}`);
    return response.data as any;
  },
};