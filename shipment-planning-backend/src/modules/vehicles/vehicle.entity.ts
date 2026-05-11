import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleStatus {
  AVAILABLE = 'available',
  ON_ROUTE = 'on_route',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 20, unique: true })
  plateNumber: string;

  @Column({ type: 'nvarchar', length: 100 })
  driverName: string;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  driverPhone: string;

  @Column({ type: 'nvarchar', length: 50 })
  vehicleType: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  capacityKg: number;

  @Column({ type: 'int', nullable: true })
  palletCapacity: number;

  // MSSQL'de enum yok — nvarchar kullanıyoruz
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