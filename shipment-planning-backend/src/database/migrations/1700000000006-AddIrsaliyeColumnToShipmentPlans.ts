import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIrsaliyeColumnToShipmentPlans1700000000006 implements MigrationInterface {
  name = 'AddIrsaliyeColumnToShipmentPlans1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('shipment_plans', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('shipment_plans', 'irsaliye') IS NULL
          ALTER TABLE shipment_plans ADD irsaliye NVARCHAR(MAX) NULL;
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('shipment_plans', 'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH('shipment_plans', 'irsaliye') IS NOT NULL
          ALTER TABLE shipment_plans DROP COLUMN irsaliye;
      END
    `);
  }
}
