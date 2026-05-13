import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentPlansService } from './shipment-plans.service';
import { ShipmentPlansController } from './shipment-plans.controller';
import { ShipmentPlan } from './shipment-plan.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentPlan, Vehicle], 'MES_DB')],
  providers: [ShipmentPlansService],
  controllers: [ShipmentPlansController],
  exports: [ShipmentPlansService],
})
export class ShipmentPlansModule {}
