import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus, ShipmentPriority } from '../shipment-plan.entity';

export class UpdateShipmentPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sevkiyat_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siparis_no?: string;

  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional({ enum: ShipmentPriority })
  @IsOptional()
  @IsEnum(ShipmentPriority)
  priority?: ShipmentPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sevkiyat_tarihi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  toplam_agirlik_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  toplam_palet?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  toplam_koli?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  revision_notes?: string;
}