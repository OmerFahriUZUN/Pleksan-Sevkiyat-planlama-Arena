import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  PLANNER = 'planner',
  WAREHOUSE = 'warehouse',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'nvarchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'nvarchar', length: 255 })
  password: string;

  @Column({ type: 'nvarchar', length: 100 })
  fullName: string;

  // MSSQL'de enum yok — nvarchar kullanıyoruz
  @Column({
    type: 'nvarchar',
    length: 20,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}