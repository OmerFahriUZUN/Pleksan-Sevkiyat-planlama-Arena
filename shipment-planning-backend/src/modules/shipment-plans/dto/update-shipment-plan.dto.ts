import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus, ShipmentPriority } from '../shipment-plan.entity';
import { OrderItemDto } from './create-shipment-plan.dto';

export class UpdateShipmentPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erpOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erpCustomerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erpCustomerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erpCustomerAddress?: string;

  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional({ enum: ShipmentPriority })
  @IsOptional()
  @IsEnum(ShipmentPriority)
  priority?: ShipmentPriority;

  @ApiPropertyOptional({ example: '2024-12-01' })
  @IsOptional()
  @IsDateString()
  plannedShipDate?: string;

  @ApiPropertyOptional({ example: '2024-12-02' })
  @IsOptional()
  @IsDateString()
  plannedDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualShipDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalPalletCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalBoxCount?: number;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}