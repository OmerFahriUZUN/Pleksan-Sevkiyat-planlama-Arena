import { apiClient } from './apiClient';

export interface DailyReportItem {
  date: string;
  shipments_processed: number;
  orders_completed: number;
  average_processing_time: number;
  on_time_delivery_rate: number;
}

export interface MonthlyReportItem {
  month: string;
  total_shipments: number;
  total_orders: number;
  total_revenue?: number;
  avg_delivery_time: number;
  on_time_rate: number;
}

export interface VehicleUtilizationReport {
  vehicle_id: string;
  plate: string;
  driver_name: string;
  trips_count: number;
  utilization_percentage: number;
  total_distance?: number;
  total_load_weight: number;
  average_load_utilization: number;
  on_time_deliveries: number;
  delayed_deliveries: number;
}

export const reportsAPI = {
  getDaily: async (date?: string): Promise<DailyReportItem[]> => {
    const params: any = {};
    if (date) params.date = date;
    
    const response = await apiClient.get<DailyReportItem[]>('/reports/daily', { params });
    return response.data;
  },

  getMonthly: async (year?: number, month?: number): Promise<MonthlyReportItem[]> => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await apiClient.get<MonthlyReportItem[]>('/reports/monthly', { params });
    return response.data;
  },

  getVehicleUtilization: async (dateFrom: string, dateTo: string): Promise<VehicleUtilizationReport[]> => {
    const params: any = {};
    params.dateFrom = dateFrom;
    params.dateTo = dateTo;
    
    const response = await apiClient.get<VehicleUtilizationReport[]>('/reports/vehicle-utilization', { params });
    return response.data;
  },
};
