import { apiClient } from './apiClient';
import type { Shipment } from '../types';

export interface Order extends Shipment {
  order_no: string;
  items?: Array<{
    product_code: string;
    product_name: string;
    quantity: number;
    unit: string;
  }>;
}

export interface PendingShipmentResponse extends Shipment {}

export const ordersAPI = {
  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  getPendingShipment: async (): Promise<PendingShipmentResponse[]> => {
    const response = await apiClient.get<PendingShipmentResponse[]>('/orders/pending-shipment');
    return response.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);
    return response.data;
  },
};
