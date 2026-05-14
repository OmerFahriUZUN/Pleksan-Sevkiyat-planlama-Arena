import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoadingConfirmedItemsToShipmentPlans1700000000007 implements MigrationInterface {
  name = 'AddLoadingConfirmedItemsToShipmentPlans1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('shipment_plans', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('shipment_plans', 'loading_confirmed_items') IS NULL
          ALTER TABLE shipment_plans ADD loading_confirmed_items NVARCHAR(MAX) NULL;
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('shipment_plans', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('shipment_plans', 'loading_confirmed_items') IS NOT NULL
          ALTER TABLE shipment_plans DROP COLUMN loading_confirmed_items;
      END
    `);
  }
}
