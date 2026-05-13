import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleDimensionColumns1700000000004 implements MigrationInterface {
  name = 'AddVehicleDimensionColumns1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('vehicles', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('vehicles', 'ic_uzunluk_mm') IS NULL
          ALTER TABLE vehicles ADD ic_uzunluk_mm DECIMAL(8,0) NULL;
        IF COL_LENGTH('vehicles', 'ic_genislik_mm') IS NULL
          ALTER TABLE vehicles ADD ic_genislik_mm DECIMAL(8,0) NULL;
        IF COL_LENGTH('vehicles', 'ic_yukseklik_mm') IS NULL
          ALTER TABLE vehicles ADD ic_yukseklik_mm DECIMAL(8,0) NULL;
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('vehicles', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('vehicles', 'ic_uzunluk_mm') IS NOT NULL
          ALTER TABLE vehicles DROP COLUMN ic_uzunluk_mm;
        IF COL_LENGTH('vehicles', 'ic_genislik_mm') IS NOT NULL
          ALTER TABLE vehicles DROP COLUMN ic_genislik_mm;
        IF COL_LENGTH('vehicles', 'ic_yukseklik_mm') IS NOT NULL
          ALTER TABLE vehicles DROP COLUMN ic_yukseklik_mm;
      END
    `);
  }
}
