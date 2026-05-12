// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type CountryType = 'DOMESTIC' | 'EXPORT';

export type ShipmentStatus =
  | 'PLANNED'
  | 'PICKING'
  | 'PACKING'
  | 'LOADING'
  | 'SHIPPED';

export type TaskType = 'PICKING' | 'PACKING' | 'LOADING';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';

export type PackageType = 'BOX' | 'PALLET' | 'PACKAGE';

export type PersonnelRole = 'PICKER' | 'PACKER' | 'LOADER';

export type UserRole = 'admin' | 'planner' | 'warehouse' | 'viewer';

// ─── ERP INTEGRATION ─────────────────────────────────────────────────────────

export interface ErpShipmentRow {
  shipment_no: string;
  order_no: string;
  shipment_date: string;
  due_date: string;
  destination_name: string;
  delivery_address: string;
  country_type: CountryType;
  city: string;
  shipment_status: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  package_type?: PackageType;
}

// ─── MES DB MODELS ───────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  shipment_no: string;
  order_no: string;
  due_date: string;
  shipment_date: string;
  destination_name: string;
  delivery_address: string;
  country_type: CountryType;
  city: string;
  status: ShipmentStatus;
  delivery_sequence?: number;
}

export interface ShipmentLine {
  id: string;
  shipment_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  scanned_quantity: number;
}

export interface Product {
  product_code: string;
  volume_dm3: number;
  weight_kg: number;
  fragile: boolean;
  stackable: boolean;
  default_package_type: PackageType;
}

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  shift_start: string;
  shift_end: string;
  avatar?: string;
}

export interface Task {
  id: string;
  shipment_id: string;
  shipment_no: string;
  type: TaskType;
  assigned_person_id: string | null;
  assigned_person_ids?: string[] | null;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: TaskStatus;
  duration_minutes: number;
}

export interface Package {
  id: string;
  shipment_id: string;
  package_type: PackageType;
  total_weight: number;
  total_volume: number;
  stretch_wrap: boolean;
  items: PackageItem[];
}

export interface PackageItem {
  id: string;
  package_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg: number;
  volume_dm3: number;
  fragile: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight: number;
  driver_name: string;
}

export interface VehicleAssignment {
  id: string;
  shipment_id: string;
  vehicle_id: string;
  delivery_sequence: number;
}

export interface LoadingPlan {
  id: string;
  package_id: string;
  vehicle_id: string;
  load_sequence: number;
  position_x?: number;
  position_y?: number;
  position_z?: number;
}

export interface ScanLog {
  id: string;
  shipment_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  operator_id: string;
  timestamp: string;
  synced: boolean;
}

// ─── UI TYPES ────────────────────────────────────────────────────────────────

export interface GanttBar {
  task_id: string;
  shipment_no: string;
  type: TaskType;
  start: Date;
  end: Date;
  assigned_person: string;
  status: TaskStatus;
  color: string;
}

export interface DashboardStats {
  total_shipments: number;
  delayed: number;
  on_time: number;
  in_progress: number;
  vehicle_utilization: number;
  avg_loading_time: number;
  personnel_efficiency: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SyncStatus {
  last_sync: string | null;
  syncing: boolean;
  error: string | null;
  next_sync_in: number;
}
