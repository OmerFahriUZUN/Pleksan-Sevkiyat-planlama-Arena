import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_OPERATION = 'in_operation',
  MAINTENANCE = 'maintenance',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 50 })
  arac_tipi: string;

  @Column({ type: 'nvarchar', length: 20, unique: true })
  plaka: string;

  @Column({ type: 'nvarchar', length: 100 })
  sofor_adi: string;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  sofor_telefon: string;

  // İç ölçüler (mm)
  @Column({ type: 'decimal', precision: 8, scale: 0, nullable: true })
  ic_uzunluk_mm: number;

  @Column({ type: 'decimal', precision: 8, scale: 0, nullable: true })
  ic_genislik_mm: number;

  @Column({ type: 'decimal', precision: 8, scale: 0, nullable: true })
  ic_yukseklik_mm: number;

  // Max ağırlık (kg)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  max_agirlik_kg: number;

  @Column({ type: 'int', nullable: true })
  palet_kapasitesi: number;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}