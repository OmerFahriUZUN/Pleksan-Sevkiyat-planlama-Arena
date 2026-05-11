import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/user.entity';
import { ShipmentPlan } from '../modules/shipment-plans/shipment-plan.entity';
import { Vehicle } from '../modules/vehicles/vehicle.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.MES_DB_HOST || 'localhost',
  port: Number(process.env.MES_DB_PORT) || 1433,
  username: process.env.MES_DB_USER,
  password: process.env.MES_DB_PASSWORD,
  database: process.env.MES_DB_NAME,
  entities: [User, ShipmentPlan, Vehicle],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(process.env.MES_DB_INSTANCE
      ? { instanceName: process.env.MES_DB_INSTANCE }
      : {}),
  },
});