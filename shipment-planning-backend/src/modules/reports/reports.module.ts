import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ShipmentPlan } from '../shipment-plans/shipment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentPlan], 'MES_DB')],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}