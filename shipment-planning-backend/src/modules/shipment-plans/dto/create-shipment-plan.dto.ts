import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentPriority } from '../shipment-plan.entity';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  erpProductId: string;

  @ApiProperty()
  @IsString()
  productCode: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightKg?: number;
}

export class CreateShipmentPlanDto {
  @ApiProperty({ example: 'Müşteri A - Haftalık Sevkiyat' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'ERP-ORD-00123' })
  @IsString()
  @IsNotEmpty()
  erpOrderId: string;

  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  erpCustomerId: string;

  @ApiProperty({ example: 'Ford Otosan A.Ş.' })
  @IsString()
  @IsNotEmpty()
  erpCustomerName: string;

  @ApiPropertyOptional({ example: 'Kocaeli, Türkiye' })
  @IsOptional()
  @IsString()
  erpCustomerAddress?: string;

  @ApiProperty({ enum: ShipmentPriority, example: ShipmentPriority.MEDIUM })
  @IsEnum(ShipmentPriority)
  priority: ShipmentPriority;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  plannedShipDate: string;

  @ApiProperty({ example: '2024-12-02' })
  @IsDateString()
  plannedDeliveryDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  totalWeightKg?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  totalPalletCount?: number;

  @ApiPropertyOptional({ example: 120 })
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