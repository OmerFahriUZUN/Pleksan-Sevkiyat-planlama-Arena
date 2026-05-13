import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { ShipmentPlan } from '../modules/shipment-plans/shipment-plan.entity';
import { Vehicle } from '../modules/vehicles/vehicle.entity';
import { Personnel } from '../modules/personnel/personnel.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      name: 'MES_DB',
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('MES_DB_HOST', 'localhost'),
        port: Number(configService.get<string>('MES_DB_PORT', '1433')),
        username: configService.get<string>('MES_DB_USER'),
        password: configService.get<string>('MES_DB_PASSWORD'),
        database: configService.get<string>('MES_DB_NAME'),
        entities: [User, ShipmentPlan, Vehicle, Personnel],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class MesDbModule {}
