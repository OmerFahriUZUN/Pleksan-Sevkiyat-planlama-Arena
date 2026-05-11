import { apiClient } from './apiClient';
import type { Shipment, ShipmentLine, DashboardStats } from '../types';

export interface CreateShipmentPlanRequest {
  shipment_no: string;
  order_no: string;
  due_date: string;
  shipment_date: string;
  destination_name: string;
  delivery_address: string;
  country_type: 'DOMESTIC' | 'EXPORT';
  city: string;
  lines?: Array<{
    product_code: string;
    product_name: string;
    quantity: number;
    unit: string;
  }>;
}

export interface UpdateShipmentPlanRequest {
  shipment_no?: string;
  order_no?: string;
  due_date?: string;
  destination_name?: string;
  delivery_address?: string;
  city?: string;
}

export interface UpdateShipmentStatusRequest {
  status: 'PLANNED' | 'PICKING' | 'PACKING' | 'LOADING' | 'SHIPPED';
}

export interface ShipmentPlanResponse extends Shipment {
  lines?: ShipmentLine[];
}

export interface DashboardResponse extends DashboardStats {}

export const shipmentPlansAPI = {
  getAll: async (): Promise<ShipmentPlanResponse[]> => {
    const response = await apiClient.get<ShipmentPlanResponse[]>('/shipment-plans');
    return response.data;
  },

  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>('/shipment-plans/dashboard');
    return response.data;
  },

  getById: async (id: string): Promise<ShipmentPlanResponse> => {
    const response = await apiClient.get<ShipmentPlanResponse>(`/shipment-plans/${id}`);
    return response.data;
  },

  create: async (data: CreateShipmentPlanRequest): Promise<ShipmentPlanResponse> => {
    const response = await apiClient.post<ShipmentPlanResponse>('/shipment-plans', data);
    return response.data;
  },

  update: async (id: string, data: UpdateShipmentPlanRequest): Promise<ShipmentPlanResponse> => {
    const response = await apiClient.patch<ShipmentPlanResponse>(`/shipment-plans/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateShipmentStatusRequest): Promise<ShipmentPlanResponse> => {
    const response = await apiClient.patch<ShipmentPlanResponse>(`/shipment-plans/${id}/status`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shipment-plans/${id}`);
  },
};
