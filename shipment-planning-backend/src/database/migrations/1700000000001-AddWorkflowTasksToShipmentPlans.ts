import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowTasksToShipmentPlans1700000000001 implements MigrationInterface {
  name = 'AddWorkflowTasksToShipmentPlans1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [shipment_plans]
      ADD [workflowTasks] NVARCHAR(MAX) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [shipment_plans]
      DROP COLUMN [workflowTasks]
    `);
  }
}
