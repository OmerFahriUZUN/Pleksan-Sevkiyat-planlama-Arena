import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixVehiclesAndPersonnelSchema1700000000003 implements MigrationInterface {
  name = 'FixVehiclesAndPersonnelSchema1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename existing vehicle columns to match entity naming
    await queryRunner.query(`
      IF OBJECT_ID('vehicles', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('vehicles', 'vehicleType') IS NOT NULL EXEC sp_rename 'vehicles.vehicleType', 'arac_tipi', 'COLUMN';
        IF COL_LENGTH('vehicles', 'plateNumber') IS NOT NULL EXEC sp_rename 'vehicles.plateNumber', 'plaka', 'COLUMN';
        IF COL_LENGTH('vehicles', 'driverName') IS NOT NULL EXEC sp_rename 'vehicles.driverName', 'sofor_adi', 'COLUMN';
        IF COL_LENGTH('vehicles', 'driverPhone') IS NOT NULL EXEC sp_rename 'vehicles.driverPhone', 'sofor_telefon', 'COLUMN';
        IF COL_LENGTH('vehicles', 'capacityKg') IS NOT NULL EXEC sp_rename 'vehicles.capacityKg', 'max_agirlik_kg', 'COLUMN';
        IF COL_LENGTH('vehicles', 'palletCapacity') IS NOT NULL EXEC sp_rename 'vehicles.palletCapacity', 'palet_kapasitesi', 'COLUMN';

        IF OBJECT_ID('CHK_vehicles_status', 'C') IS NOT NULL
          ALTER TABLE vehicles DROP CONSTRAINT CHK_vehicles_status;

        UPDATE vehicles SET status = 'in_operation' WHERE status = 'on_route';

        ALTER TABLE vehicles
          ADD CONSTRAINT CHK_vehicles_status
            CHECK (status IN ('available','on_route','in_operation','maintenance','inactive'));
      END
    `);

    // Create personnel table if it does not exist
    await queryRunner.query(`
      IF OBJECT_ID('personnel', 'U') IS NULL
      BEGIN
        CREATE TABLE [personnel] (
          [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
          [ad_soyad] NVARCHAR(100) NOT NULL,
          [role] NVARCHAR(20) NOT NULL
            CONSTRAINT CHK_personnel_role
            CHECK ([role] IN ('PICKER','PACKER','LOADER','MULTI')),
          [vardiya_baslangic] NVARCHAR(20) NOT NULL,
          [vardiya_bitis] NVARCHAR(20) NOT NULL,
          [isActive] BIT NOT NULL DEFAULT 1,
          [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
          [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT PK_personnel PRIMARY KEY ([id])
        );
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('personnel', 'U') IS NOT NULL
      BEGIN
        DROP TABLE [personnel];
      END
    `);

    await queryRunner.query(`
      IF OBJECT_ID('vehicles', 'U') IS NOT NULL
      BEGIN
        IF OBJECT_ID('CHK_vehicles_status', 'C') IS NOT NULL
          ALTER TABLE vehicles DROP CONSTRAINT CHK_vehicles_status;

        UPDATE vehicles SET status = 'on_route' WHERE status = 'in_operation';

        ALTER TABLE vehicles
          ADD CONSTRAINT CHK_vehicles_status
            CHECK (status IN ('available','on_route','maintenance','inactive'));

        IF COL_LENGTH('vehicles', 'arac_tipi') IS NOT NULL EXEC sp_rename 'vehicles.arac_tipi', 'vehicleType', 'COLUMN';
        IF COL_LENGTH('vehicles', 'plaka') IS NOT NULL EXEC sp_rename 'vehicles.plaka', 'plateNumber', 'COLUMN';
        IF COL_LENGTH('vehicles', 'sofor_adi') IS NOT NULL EXEC sp_rename 'vehicles.sofor_adi', 'driverName', 'COLUMN';
        IF COL_LENGTH('vehicles', 'sofor_telefon') IS NOT NULL EXEC sp_rename 'vehicles.sofor_telefon', 'driverPhone', 'COLUMN';
        IF COL_LENGTH('vehicles', 'max_agirlik_kg') IS NOT NULL EXEC sp_rename 'vehicles.max_agirlik_kg', 'capacityKg', 'COLUMN';
        IF COL_LENGTH('vehicles', 'palet_kapasitesi') IS NOT NULL EXEC sp_rename 'vehicles.palet_kapasitesi', 'palletCapacity', 'COLUMN';
      END
    `);
  }
}
