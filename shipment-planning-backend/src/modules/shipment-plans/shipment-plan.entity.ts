import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

export enum ShipmentStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ShipmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface OrderItemSnapshot {
  erpProductId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  weightKg?: number;
}

@Entity('shipment_plans')
export class ShipmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  planCode: string;

  @Column({ type: 'nvarchar', length: 255 })
  description: string;

  @Column({ type: 'nvarchar', length: 100 })
  erpOrderId: string;

  @Column({ type: 'nvarchar', length: 100 })
  erpCustomerId: string;

  @Column({ type: 'nvarchar', length: 255 })
  erpCustomerName: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  erpCustomerAddress: string;

  // MSSQL enum yok — nvarchar
  @Column({
    type: 'nvarchar',
    length: 20,
    default: ShipmentStatus.DRAFT,
  })
  status: ShipmentStatus;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: ShipmentPriority.MEDIUM,
  })
  priority: ShipmentPriority;

  @Column({ type: 'date' })
  plannedShipDate: Date;

  @Column({ type: 'date', nullable: true })
  actualShipDate: Date;

  @Column({ type: 'date' })
  plannedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalWeightKg: number;

  @Column({ type: 'int', nullable: true })
  totalPalletCount: number;

  @Column({ type: 'int', nullable: true })
  totalBoxCount: number;

  @ManyToOne(() => Vehicle, { nullable: true, eager: true })
  @JoinColumn()
  vehicle: Vehicle;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn()
  assignedTo: User;

  // MSSQL'de jsonb yok — simple-json kullanıyoruz (nvarchar(max) olarak saklanır)
  @Column({ type: 'simple-json', nullable: true })
  orderItems: OrderItemSnapshot[];

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}