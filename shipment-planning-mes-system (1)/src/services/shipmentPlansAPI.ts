import { apiClient } from './apiClient';
import type { ShipmentPlan, DashboardStats, ScanResult, PreparationCheck, VehiclePlacementResult } from '../types';

export const shipmentPlansAPI = {
  // ─── Sorgular ─────────────────────────────────────────────────────────
  getAll: async (params?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<ShipmentPlan[]> => {
    const response = await apiClient.get<ShipmentPlan[]>('/shipment-plans', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ShipmentPlan> => {
    const response = await apiClient.get<ShipmentPlan>(`/shipment-plans/${id}`);
    return response.data;
  },

  getByShipmentNo: async (no: string): Promise<ShipmentPlan> => {
    const response = await apiClient.get<ShipmentPlan>(`/shipment-plans/by-shipment-no/${no}`);
    return response.data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/shipment-plans/dashboard');
    return response.data;
  },

  getErpPool: async (): Promise<ShipmentPlan[]> => {
    const response = await apiClient.get<ShipmentPlan[]>('/shipment-plans/erp-pool');
    return response.data;
  },

  getReadyForPlanning: async (): Promise<ShipmentPlan[]> => {
    const response = await apiClient.get<ShipmentPlan[]>('/shipment-plans/ready-for-planning');
    return response.data;
  },

  // ─── ERP Import ──────────────────────────────────────────────────────
  importFromErp: async (header: any, details: any[]): Promise<ShipmentPlan> => {
    const response = await apiClient.post<ShipmentPlan>('/shipment-plans/import-erp', { header, details });
    return response.data;
  },

  create: async (data: any): Promise<ShipmentPlan> => {
    const response = await apiClient.post<ShipmentPlan>('/shipment-plans', data);
    return response.data;
  },

  // ─── Durum Yönetimi ──────────────────────────────────────────────────
  transitionStatus: async (id: string, status: string): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/status`, { status });
    return response.data;
  },

  updatePriority: async (id: string, priority: string): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/priority`, { priority });
    return response.data;
  },

  // ─── Hazırlık Kontrolü ──────────────────────────────────────────────
  updatePreparationCheck: async (id: string, checks: PreparationCheck[]): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/preparation-check`, { checks });
    return response.data;
  },

  // ─── Operasyon Yönetimi ─────────────────────────────────────────────
  createOperations: async (id: string, pickingMin: number, packingMin: number, loadingMin: number): Promise<ShipmentPlan> => {
    const response = await apiClient.post<ShipmentPlan>(`/shipment-plans/${id}/operations`, { picking_minutes: pickingMin, packing_minutes: packingMin, loading_minutes: loadingMin });
    return response.data;
  },

  assignPersonnel: async (id: string, operationId: string, personelIds: string[], personelNames: string[]): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/operations/${operationId}/assign`, { personel_ids: personelIds, personel_names: personelNames });
    return response.data;
  },

  updateOperationTimes: async (id: string, operationId: string, plannedStart: string, durationMinutes: number): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/operations/${operationId}/times`, { planned_start: plannedStart, planned_duration_minutes: durationMinutes });
    return response.data;
  },

  startOperation: async (id: string, operationId: string): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/operations/${operationId}/start`);
    return response.data;
  },

  completeOperation: async (id: string, operationId: string): Promise<ShipmentPlan> => {
    const response = await apiClient.patch<ShipmentPlan>(`/shipment-plans/${id}/operations/${operationId}/complete`);
    return response.data;
  },

  // ─── Araç Atama ─────────────────────────────────────────────────────
  assignVehicle: async (id: string, vehicleId: string, plate: string, driverName: string, loadPercentage: number): Promise<ShipmentPlan> => {
    const response = await apiClient.post<ShipmentPlan>(`/shipment-plans/${id}/assign-vehicle`, { vehicle_id: vehicleId, plate, driver_name: driverName, load_percentage: loadPercentage });
    return response.data;
  },

  generateLoadingSequence: async (id: string): Promise<ShipmentPlan> => {
    const response = await apiClient.post<ShipmentPlan>(`/shipment-plans/${id}/generate-loading-sequence`);
    return response.data;
  },

  getVehiclePlacement: async (id: string): Promise<VehiclePlacementResult> => {
    const response = await apiClient.get<VehiclePlacementResult>(`/shipment-plans/${id}/vehicle-placement`);
    return response.data;
  },

  // ─── Barkod Tarama ──────────────────────────────────────────────────
  scanProduct: async (id: string, stokKodu: string, miktar: number): Promise<ScanResult> => {
    const response = await apiClient.post<ScanResult>(`/shipment-plans/${id}/scan`, { stok_kodu: stokKodu, miktar });
    return response.data;
  },

  // ─── Silme ──────────────────────────────────────────────────────────
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shipment-plans/${id}`);
  },
};