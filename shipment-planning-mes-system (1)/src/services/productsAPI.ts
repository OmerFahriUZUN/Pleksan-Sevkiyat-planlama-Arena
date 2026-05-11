import { apiClient } from './apiClient';
import type { Product } from '../types';

export interface ProductResponse extends Product {}

export interface StockLevel {
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  warehouse_location?: string;
}

export const productsAPI = {
  getAll: async (): Promise<ProductResponse[]> => {
    const response = await apiClient.get<ProductResponse[]>('/products');
    return response.data;
  },

  getStock: async (): Promise<StockLevel[]> => {
    const response = await apiClient.get<StockLevel[]>('/products/stock');
    return response.data;
  },

  getById: async (productId: string): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(`/products/${productId}`);
    return response.data;
  },
};
