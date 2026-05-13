import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixShipmentPlansSchema1700000000002 implements MigrationInterface {
  name = 'FixShipmentPlansSchema1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing table and recreate it with correct schema
    await queryRunner.query(`DROP TABLE IF EXISTS [shipment_plans]`);

    await queryRunner.query(`
      CREATE TABLE [shipment_plans] (
        [id]                          UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [sevkiyat_no]                 NVARCHAR(50)      NOT NULL UNIQUE,
        [siparis_no]                  NVARCHAR(50)      NOT NULL,
        [kart_bilgisi]                NVARCHAR(20)      NOT NULL,
        [cari_kod]                    NVARCHAR(50)      NOT NULL,
        [cari_ad]                     NVARCHAR(255)     NOT NULL,
        [nakliye_yeri]                NVARCHAR(255)     NULL,
        [cari_ulke]                   NVARCHAR(100)     NULL,
        [cari_sehir]                  NVARCHAR(100)     NULL,
        [cari_ilce]                   NVARCHAR(100)     NULL,
        [termin_tarihi]               DATE              NOT NULL,
        [sevkiyat_tarihi]             DATE              NULL,
        [islem_tarihi]                DATE              NULL,
        [status]                      NVARCHAR(30)      NOT NULL DEFAULT 'erp_imported',
        [priority]                    NVARCHAR(20)      NOT NULL DEFAULT 'normal',
        [is_partial_shipment]         BIT               NOT NULL DEFAULT 0,
        [partial_shipment_percentage] DECIMAL(5,2)      NOT NULL DEFAULT 0,
        [toplam_koli]                 DECIMAL(10,2)     NOT NULL DEFAULT 0,
        [toplam_palet]                DECIMAL(10,2)     NOT NULL DEFAULT 0,
        [toplam_agirlik_kg]           DECIMAL(10,2)     NOT NULL DEFAULT 0,
        [toplam_hacim_m3]             DECIMAL(10,2)     NOT NULL DEFAULT 0,
        [urun_listesi]                NVARCHAR(MAX)     NULL,
        [operations]                  NVARCHAR(MAX)     NULL,
        [vehicle_assignments]         NVARCHAR(MAX)     NULL,
        [loading_sequences]           NVARCHAR(MAX)     NULL,
        [preparation_checks]          NVARCHAR(MAX)     NULL,
        [erp_data_hash]               NVARCHAR(64)      NULL,
        [revision_notes]              NVARCHAR(500)     NULL,
        [teslimat_adresi]             NVARCHAR(500)     NULL,
        [erp_raw_header]              NVARCHAR(MAX)     NULL,
        [erp_raw_details]             NVARCHAR(MAX)     NULL,
        [createdAt]                   DATETIME2         NOT NULL DEFAULT GETDATE(),
        [updatedAt]                   DATETIME2         NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_shipment_plans PRIMARY KEY ([id])
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IDX_sp_status ON [shipment_plans] ([status])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_priority ON [shipment_plans] ([priority])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_termin_tarihi ON [shipment_plans] ([termin_tarihi])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_cari_kod ON [shipment_plans] ([cari_kod])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS [shipment_plans]`);
  }
}
