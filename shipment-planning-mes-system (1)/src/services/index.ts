// API Client and Error Handler
export { apiClient, handleApiError } from './apiClient';

// API Modules
export { authAPI } from './authAPI';
export type { LoginRequest, LoginResponse, ProfileResponse } from './authAPI';

export { shipmentPlansAPI } from './shipmentPlansAPI';
export type {
  CreateShipmentPlanRequest,
  UpdateShipmentPlanRequest,
  UpdateShipmentStatusRequest,
  ShipmentPlanResponse,
  DashboardResponse,
} from './shipmentPlansAPI';

export { ordersAPI } from './ordersAPI';
export type { Order, PendingShipmentResponse } from './ordersAPI';

export { productsAPI } from './productsAPI';
export type { ProductResponse, StockLevel } from './productsAPI';

export { customersAPI } from './customersAPI';
export type { Customer } from './customersAPI';

export { vehiclesAPI } from './vehiclesAPI';
export type {
  CreateVehicleRequest,
  UpdateVehicleStatusRequest,
  VehicleResponse,
  AvailableVehicleResponse,
} from './vehiclesAPI';

export { reportsAPI } from './reportsAPI';
export type {
  DailyReportItem,
  MonthlyReportItem,
  VehicleUtilizationReport,
} from './reportsAPI';
