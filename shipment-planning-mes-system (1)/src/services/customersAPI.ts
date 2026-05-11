import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  customer_code?: string;
}

export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>('/customers');
    return response.data;
  },

  getById: async (customerId: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${customerId}`);
    return response.data;
  },

  getHistory: async (customerId: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/customers/${customerId}/history`);
    return response.data;
  },
};
