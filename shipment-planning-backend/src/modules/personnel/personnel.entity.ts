import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PersonnelRole {
  PICKER = 'PICKER',
  PACKER = 'PACKER',
  LOADER = 'LOADER',
  MULTI = 'MULTI',
}

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100 })
  ad_soyad: string;

  @Column({ type: 'nvarchar', length: 20 })
  role: PersonnelRole;

  @Column({ type: 'nvarchar', length: 20 })
  vardiya_baslangic: string; // "08:00"

  @Column({ type: 'nvarchar', length: 20 })
  vardiya_bitis: string; // "17:00"

  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}