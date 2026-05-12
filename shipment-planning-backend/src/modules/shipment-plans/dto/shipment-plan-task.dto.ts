import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type ShipmentTaskType = 'PICKING' | 'PACKING' | 'LOADING';
export type ShipmentTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export class ShipmentTaskDto {
  @ApiPropertyOptional({ example: 'TSK-12345-PICK' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ enum: ['PICKING', 'PACKING', 'LOADING'] })
  @IsOptional()
  @IsEnum(['PICKING', 'PACKING', 'LOADING'] as any)
  type?: ShipmentTaskType;

  @ApiPropertyOptional({ example: 'PRS-001' })
  @IsOptional()
  @IsString()
  assignedPersonId?: string;

  @ApiPropertyOptional({ type: [String], example: ['PRS-001', 'PRS-002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedPersonIds?: string[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as any)
  status?: ShipmentTaskStatus;

  @ApiPropertyOptional({ example: '2025-01-20T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional({ example: '2025-01-20T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @ApiPropertyOptional({ example: '2025-01-20T08:05:00.000Z' })
  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @ApiPropertyOptional({ example: '2025-01-20T08:35:00.000Z' })
  @IsOptional()
  @IsDateString()
  actualEnd?: string;
}

export class UpdateShipmentTaskDto {
  @ApiPropertyOptional({ example: 'PRS-001' })
  @IsOptional()
  @IsString()
  assigned_person_id?: string;

  @ApiPropertyOptional({ type: [String], example: ['PRS-001', 'PRS-002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigned_person_ids?: string[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  duration_minutes?: number;
}
