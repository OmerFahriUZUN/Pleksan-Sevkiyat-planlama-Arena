import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ErpImportStatus {
  ERP_IMPORTED = 'ERP_IMPORTED',
  READY_FOR_PLANNING = 'READY_FOR_PLANNING',
  WAITING_STOCK = 'WAITING_STOCK',
  WAITING_QUALITY = 'WAITING_QUALITY',
  BLOCKED = 'BLOCKED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
}

@Entity('erp_shipments')
export class ErpShipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  @Index()
  shipment_no: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  order_no: string;

  @Column({ type: 'nvarchar', length: 20 })
  country_type: string; // YURTICI / YURTDISI

  @Column({ type: 'nvarchar', length: 100 })
  cari_kod: string;

  @Column({ type: 'nvarchar', length: 255 })
  cari_ad: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  nakliye_yeri: string;

  @Column({ type: 'nvarchar', length: 50 })
  is_yeri: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  delivery_address: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_ulke: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_sehir: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cari_ilce: string;

  @Column({ type: 'nvarchar', length: 50 })
  islem_tarihi: string;

  @Column({ type: 'nvarchar', length: 50 })
  termin_tarihi: string;

  @Column({ type: 'nvarchar', length: 50 })
  sevkiyat_tarihi: string;

  @Column({ type: 'simple-json', nullable: true })
  lines: ErpShipmentLine[];

  @Column({
    type: 'nvarchar',
    length: 30,
    default: ErpImportStatus.ERP_IMPORTED,
  })
  status: ErpImportStatus;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  revision_flag: boolean;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  previous_hash: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  current_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export interface ErpShipmentLine {
  stok_kodu: string;
  stok_adi: string;
  sevk_emir_miktari: number;
  sevk_emri_kalan: number;
  depo_kodu: string;
  sevk_tarihi: string;
  birimi: string;
  kutu_adedi?: number;
  palet_adedi?: number;
  hacim_m3?: number;
  agirlik_kg?: number;
}