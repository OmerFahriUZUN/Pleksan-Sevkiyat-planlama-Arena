import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MesDbModule } from './database/mes-db.module';
import { ErpApiModule } from './modules/erp/erp-api.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShipmentPlansModule } from './modules/shipment-plans/shipment-plans.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MesDbModule,
    ErpApiModule,
    AuthModule,
    UsersModule,
    ShipmentPlansModule,
    VehiclesModule,
    PersonnelModule,
    ReportsModule,
  ],
})
export class AppModule {}
