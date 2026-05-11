import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '../vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: '34 ABC 123' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiPropertyOptional({ example: '+90 555 123 4567' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiProperty({ example: 'Kamyon' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 20000 })
  @IsNumber()
  capacityKg: number;

  @ApiPropertyOptional({ example: 33 })
  @IsOptional()
  @IsNumber()
  palletCapacity?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}