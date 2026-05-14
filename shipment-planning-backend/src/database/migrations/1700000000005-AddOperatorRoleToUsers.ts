import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperatorRoleToUsers1700000000005 implements MigrationInterface {
  name = 'AddOperatorRoleToUsers1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eski constraint'i kaldır
    await queryRunner.query(
      `ALTER TABLE [users] DROP CONSTRAINT [CHK_users_role]`
    );

    // Yeni constraint'i ekle (operator rolünü dahil et)
    await queryRunner.query(
      `ALTER TABLE [users] ADD CONSTRAINT [CHK_users_role] CHECK ([role] IN ('admin','planner','warehouse','operator','viewer'))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Yeni constraint'i kaldır
    await queryRunner.query(
      `ALTER TABLE [users] DROP CONSTRAINT [CHK_users_role]`
    );

    // Eski constraint'i geri yükle
    await queryRunner.query(
      `ALTER TABLE [users] ADD CONSTRAINT [CHK_users_role] CHECK ([role] IN ('admin','planner','warehouse','viewer'))`
    );
  }
}
