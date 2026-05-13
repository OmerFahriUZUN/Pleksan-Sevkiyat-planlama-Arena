// ─── ENUMS ─────────────────────────────────────────────────────────────────────

export type CountryType = 'DOMESTIC' | 'EXPORT';

export type ShipmentStatus =
  | 'erp_imported'
  | 'waiting_stock'
  | 'waiting_quality'
  | 'blocked'
  | 'ready_for_planning'
  | 'planned'
  | 'picking'
  | 'packing'
  | 'loading'
  | 'partial_shipment'
  | 'shipped'
  | 'cancelled'
  | 'revision_required';

export type OperationType = 'PICKING' | 'PACKING' | 'LOADING';

export type OperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type ShipmentPriority = 'low' | 'normal' | 'high' | 'critical';

export type PersonnelRole = 'PICKER' | 'PACKER' | 'LOADER' | 'MULTI';

export type UserRole = 'admin' | 'planner' | 'warehouse' | 'operator' | 'viewer';

export type VehicleStatus = 'available' | 'in_operation' | 'maintenance';

// ─── ERP INTEGRATION ─────────────────────────────────────────────────────────

export interface ErpShipmentHeader {
  is_yeri: string;
  kart_bilgisi: 'YURTICI' | 'YURTDISI';
  sevkiyat_no: string;
  siparis_no: string;
  cari_kod: string;
  cari_ad: string;
  nakliye_yeri: string;
  islem_tarihi: string;
  termin_tarihi: string;
  sevkiyat_tarihi: string;
  cari_ulke: string;
  cari_sehir: string;
  cari_ilce: string;
}

export interface ErpShipmentDetail {
  stok_kodu: string;
  stok_adi: string;
  sevk_emir_miktari: number;
  sevk_emri_kalan: number;
  depo_kodu: string;
  sevk_tarihi: string;
}

// ─── CORE DOMAIN MODELS ───────────────────────────────────────────────────────

export interface OrderProduct {
  id?: string;
  stok_kodu: string;
  stok_adi: string;
  miktar: number;
  kalan_miktar: number;
  koli_sayisi: number;
  palet_sayisi: number;
  hacim_m3: number;
  agirlik: number;
  depo_kodu: string;
  scanned_quantity: number;
  koli_uzunluk_m?: number;
  koli_genislik_m?: number;
  koli_yukseklik_m?: number;
}

export interface Operation {
  id: string;
  type: OperationType;
  personel_ids: string[];
  personel_names: string[];
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;
  status: OperationStatus;
}

export interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  plate: string;
  driver_name: string;
  load_percentage: number;
  delivery_sequence: number;
}

export interface LoadingSequence {
  id: string;
  vehicle_assignment_id: string;
  product_code: string;
  product_name: string;
  pallet_count: number;
  box_count: number;
  sequence_order: number;
  is_first_delivery: boolean;
  is_last_delivery: boolean;
  weight_kg: number;
  volume_m3: number;
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
}

export interface PreparationCheck {
  stok_kodu: string;
  stok_adi: string;
  is_stock_sufficient: boolean;
  is_product_ready: boolean;
  is_quality_approved: boolean;
  is_warehouse_suitable: boolean;
  notes: string;
}

export interface ShipmentPlan {
  id: string;
  sevkiyat_no: string;
  siparis_no: string;
  kart_bilgisi: string;
  cari_kod: string;
  cari_ad: string;
  nakliye_yeri: string;
  cari_ulke: string;
  cari_sehir: string;
  cari_ilce: string;
  termin_tarihi: string;
  sevkiyat_tarihi: string | null;
  islem_tarihi: string | null;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  is_partial_shipment: boolean;
  partial_shipment_percentage: number;
  toplam_koli: number;
  toplam_palet: number;
  toplam_agirlik_kg: number;
  toplam_hacim_m3: number;
  urun_listesi: OrderProduct[];
  operations: Operation[];
  vehicle_assignments: VehicleAssignment[];
  loading_sequences: LoadingSequence[];
  preparation_checks: PreparationCheck[];
  erp_data_hash: string;
  revision_notes: string;
  teslimat_adresi: string;
  erp_raw_header: ErpShipmentHeader;
  erp_raw_details: ErpShipmentDetail[];
  createdAt: string;
  updatedAt: string;
}

// ─── PERSONNEL ────────────────────────────────────────────────────────────────

export interface Personnel {
  id: string;
  ad_soyad: string;
  role: PersonnelRole;
  vardiya_baslangic: string;
  vardiya_bitis: string;
  isActive: boolean;
}

// ─── VEHICLE ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  arac_tipi: string;
  plaka: string;
  sofor_adi: string;
  sofor_telefon: string;
  ic_uzunluk_mm: number;
  ic_genislik_mm: number;
  ic_yukseklik_mm: number;
  max_agirlik_kg: number;
  palet_kapasitesi: number;
  status: VehicleStatus;
  isActive: boolean;
}

// ─── USER / AUTH ─────────────────────────────────────────────────────────────

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

// ─── NOTIFICATION & SYNC ──────────────────────────────────────────────────────

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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  delayed: number;
  in_progress: number;
  shipped: number;
  planned: number;
  waiting_preparation: number;
  revision_required: number;
  partial_shipments: number;
  total_hacim_m3: number;
  total_agirlik_kg: number;
  operation_efficiency: number;
}

// ─── SCAN ────────────────────────────────────────────────────────────────────

export interface ScanResult {
  result: 'OK' | 'WRONG_PRODUCT' | 'EXCESS' | 'COMPLETE';
  plan: ShipmentPlan;
}

export interface VehiclePlacementBlock {
  id: string;
  product_code: string;
  product_name: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  x_mm: number;
  y_mm: number;
  z_mm: number;
  vehicle_assignment_id: string;
  sequence_order: number;
  weight_kg: number;
  volume_m3: number;
  color: string;
}

export interface VehiclePlacementAssignment {
  vehicle_assignment_id: string;
  plate: string;
  driver_name: string;
  load_percentage: number;
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    volume_m3: number;
  };
  total_volume_m3: number;
  used_volume_m3: number;
  utilization: number;
  blocks: VehiclePlacementBlock[];
}

export interface VehiclePlacementResult {
  shipment_id: string;
  assignments: VehiclePlacementAssignment[];
}
