import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentPlansService } from './shipment-plans.service';
import { ShipmentPlansController } from './shipment-plans.controller';
import { ShipmentPlan } from './shipment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentPlan], 'MES_DB')],
  providers: [ShipmentPlansService],
  controllers: [ShipmentPlansController],
  exports: [ShipmentPlansService],
})
export class ShipmentPlansModule {}