import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ─── ENUMS ─────────────────────────────────────────────────────────────────────

export enum ShipmentStatus {
  // ERP'den yeni geldi
  ERP_IMPORTED = 'erp_imported',
  // Hazırlık kontrolü bekliyor
  WAITING_STOCK = 'waiting_stock',
  WAITING_QUALITY = 'waiting_quality',
  BLOCKED = 'blocked',
  // Planlamaya hazır
  READY_FOR_PLANNING = 'ready_for_planning',
  // Planlandı
  PLANNED = 'planned',
  // Operasyonlar
  PICKING = 'picking',
  PACKING = 'packing',
  LOADING = 'loading',
  // Kısmi sevkiyat
  PARTIAL_SHIPMENT = 'partial_shipment',
  // Tam sevkiyat
  SHIPPED = 'shipped',
  CANCELLED = 'cancelled',
  // ERP değişikliği
  REVISION_REQUIRED = 'revision_required',
}

export enum ShipmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum OperationType {
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  LOADING = 'LOADING',
}

export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ─── INTERFACES ────────────────────────────────────────────────────────────────

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
  koli_sayisi?: number;
  palet_sayisi?: number;
  hacim_m3?: number;
  agirlik?: number;
  koli_uzunluk_m?: number;
  koli_genislik_m?: number;
  koli_yukseklik_m?: number;
}

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
  depth_mm?: number;
  height_mm?: number;
}

export interface LoadingConfirmedItem {
  id: string;
  product_code: string;
  block_id: string;
  confirmed_at: string;
  confirmed_by: string;
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

export interface Irsaliye {
  irsaliye_no: string;
  sevkiyat_no: string;
  tarih: string;
  cari_ad: string;
  cari_kod: string;
  plaka: string;
  sofor_adi: string;
  urunler: {
    stok_kodu: string;
    stok_adi: string;
    miktar: number;
    birim: string;
  }[];
  toplam_koli: number;
  toplam_palet: number;
  toplam_agirlik_kg: number;
}

// ─── ENTITY ────────────────────────────────────────────────────────────────────

@Entity('shipment_plans')
export class ShipmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── ERP Alanları ─────────────────────────────────────────────────────────
  @Column({ type: 'nvarchar', length: 50, unique: true })
  sevkiyat_no: string;

  @Column({ type: 'nvarchar', length: 50 })
  siparis_no: string;

  @Column({ type: 'nvarchar', length: 20 })
  kart_bilgisi: string; // YURTICI / YURTDISI

  @Column({ type: 'nvarchar', length: 50 })
  cari_kod: string;

  @Column({ type: 'nvarchar', length: 255 })
  cari_ad: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  nakliye_yeri: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_ulke: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_sehir: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_ilce: string;

  @Column({ type: 'date' })
  termin_tarihi: Date;

  @Column({ type: 'date', nullable: true })
  sevkiyat_tarihi: Date;

  @Column({ type: 'date', nullable: true })
  islem_tarihi: Date;

  // ─── Durum ve Öncelik ────────────────────────────────────────────────────
  @Column({ type: 'nvarchar', length: 30, default: ShipmentStatus.ERP_IMPORTED })
  status: ShipmentStatus;

  @Column({ type: 'nvarchar', length: 20, default: ShipmentPriority.NORMAL })
  priority: ShipmentPriority;

  @Column({ type: 'bit', default: 0 })
  is_partial_shipment: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  partial_shipment_percentage: number; // İlk gönderim %60 gibi

  // ─── Toplam Değerler ─────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  toplam_koli: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  toplam_palet: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  toplam_agirlik_kg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  toplam_hacim_m3: number;

  // ─── JSON Veriler ────────────────────────────────────────────────────────
  @Column({ type: 'simple-json', nullable: true })
  urun_listesi: OrderProduct[];

  @Column({ type: 'simple-json', nullable: true })
  operations: Operation[];

  @Column({ type: 'simple-json', nullable: true })
  vehicle_assignments: VehicleAssignment[];

  @Column({ type: 'simple-json', nullable: true })
  loading_sequences: LoadingSequence[];

  @Column({ type: 'simple-json', nullable: true })
  loading_confirmed_items: LoadingConfirmedItem[];

  @Column({ type: 'simple-json', nullable: true })
  preparation_checks: PreparationCheck[];

  @Column({ type: 'simple-json', nullable: true })
  irsaliye: Irsaliye;

  // ─── ERP Hash (Değişiklik tespiti için) ──────────────────────────────────
  @Column({ type: 'nvarchar', length: 64, nullable: true })
  erp_data_hash: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  revision_notes: string;

  // ─── İlişkiler ───────────────────────────────────────────────────────────
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  teslimat_adresi: string;

  @Column({ type: 'simple-json', nullable: true })
  erp_raw_header: ErpShipmentHeader;

  @Column({ type: 'simple-json', nullable: true })
  erp_raw_details: ErpShipmentDetail[];

  // ─── Zaman Damgaları ─────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}