import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===================== USERS TABLOSU =====================
    await queryRunner.query(`
      CREATE TABLE [users] (
        [id]          UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [username]    NVARCHAR(100)      NOT NULL,
        [email]       NVARCHAR(255)      NOT NULL,
        [password]    NVARCHAR(255)      NOT NULL,
        [fullName]    NVARCHAR(100)      NOT NULL,
        [role]        NVARCHAR(20)       NOT NULL DEFAULT 'viewer'
                      CONSTRAINT CHK_users_role
                      CHECK ([role] IN ('admin','planner','warehouse','viewer')),
        [isActive]    BIT                NOT NULL DEFAULT 1,
        [createdAt]   DATETIME2          NOT NULL DEFAULT GETDATE(),
        [updatedAt]   DATETIME2          NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_users PRIMARY KEY ([id]),
        CONSTRAINT UQ_users_username UNIQUE ([username]),
        CONSTRAINT UQ_users_email    UNIQUE ([email])
      )
    `);

    // ===================== VEHICLES TABLOSU =====================
    await queryRunner.query(`
      CREATE TABLE [vehicles] (
        [id]             UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [plateNumber]    NVARCHAR(20)      NOT NULL,
        [driverName]     NVARCHAR(100)     NOT NULL,
        [driverPhone]    NVARCHAR(20)      NULL,
        [vehicleType]    NVARCHAR(50)      NOT NULL,
        [capacityKg]     DECIMAL(8,2)      NOT NULL,
        [palletCapacity] INT               NULL,
        [status]         NVARCHAR(20)      NOT NULL DEFAULT 'available'
                         CONSTRAINT CHK_vehicles_status
                         CHECK ([status] IN ('available','on_route','maintenance','inactive')),
        [isActive]       BIT               NOT NULL DEFAULT 1,
        [createdAt]      DATETIME2         NOT NULL DEFAULT GETDATE(),
        [updatedAt]      DATETIME2         NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_vehicles PRIMARY KEY ([id]),
        CONSTRAINT UQ_vehicles_plate UNIQUE ([plateNumber])
      )
    `);

    // ===================== SHIPMENT_PLANS TABLOSU =====================
    await queryRunner.query(`
      CREATE TABLE [shipment_plans] (
        [id]                   UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWSEQUENTIALID(),
        [planCode]             NVARCHAR(50)      NOT NULL,
        [description]          NVARCHAR(255)     NOT NULL,
        [erpOrderId]           NVARCHAR(100)     NOT NULL,
        [erpCustomerId]        NVARCHAR(100)     NOT NULL,
        [erpCustomerName]      NVARCHAR(255)     NOT NULL,
        [erpCustomerAddress]   NVARCHAR(500)     NULL,
        [status]               NVARCHAR(20)      NOT NULL DEFAULT 'draft'
                               CONSTRAINT CHK_sp_status
                               CHECK ([status] IN ('draft','planned','loading','in_transit','delivered','cancelled')),
        [priority]             NVARCHAR(20)      NOT NULL DEFAULT 'medium'
                               CONSTRAINT CHK_sp_priority
                               CHECK ([priority] IN ('low','medium','high','urgent')),
        [plannedShipDate]      DATE              NOT NULL,
        [actualShipDate]       DATE              NULL,
        [plannedDeliveryDate]  DATE              NOT NULL,
        [actualDeliveryDate]   DATE              NULL,
        [totalWeightKg]        DECIMAL(10,2)     NULL,
        [totalPalletCount]     INT               NULL,
        [totalBoxCount]        INT               NULL,
        [vehicleId]            UNIQUEIDENTIFIER  NULL,
        [createdById]          UNIQUEIDENTIFIER  NOT NULL,
        [assignedToId]         UNIQUEIDENTIFIER  NULL,
        [orderItems]           NVARCHAR(MAX)     NULL,
        [notes]                NVARCHAR(1000)    NULL,
        [createdAt]            DATETIME2         NOT NULL DEFAULT GETDATE(),
        [updatedAt]            DATETIME2         NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_shipment_plans    PRIMARY KEY ([id]),
        CONSTRAINT UQ_sp_planCode       UNIQUE ([planCode]),
        CONSTRAINT FK_sp_vehicle        FOREIGN KEY ([vehicleId])
                                        REFERENCES [vehicles]([id]),
        CONSTRAINT FK_sp_createdBy      FOREIGN KEY ([createdById])
                                        REFERENCES [users]([id]),
        CONSTRAINT FK_sp_assignedTo     FOREIGN KEY ([assignedToId])
                                        REFERENCES [users]([id])
      )
    `);

    // ===================== INDEX'LER =====================
    await queryRunner.query(`
      CREATE INDEX IDX_sp_status
        ON [shipment_plans] ([status])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_plannedShipDate
        ON [shipment_plans] ([plannedShipDate])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_erpCustomerId
        ON [shipment_plans] ([erpCustomerId])
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_sp_priority
        ON [shipment_plans] ([priority])
    `);

    // ===================== DEFAULT ADMIN KULLANICI =====================
    // Şifre: Admin123! (bcrypt hash)
    await queryRunner.query(`
      INSERT INTO [users] 
        ([id], [username], [email], [password], [fullName], [role], [isActive])
      VALUES 
        (
          NEWID(),
          'admin',
          'admin@pleksan.com',
          '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6oKOp5PKVK',
          'Sistem Yöneticisi',
          'admin',
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS [shipment_plans]`);
    await queryRunner.query(`DROP TABLE IF EXISTS [vehicles]`);
    await queryRunner.query(`DROP TABLE IF EXISTS [users]`);
  }
}