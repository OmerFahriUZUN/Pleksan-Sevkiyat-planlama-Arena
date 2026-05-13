import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '../vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Kamyon' })
  @IsString()
  @IsNotEmpty()
  arac_tipi: string;

  @ApiProperty({ example: '34 ABC 123' })
  @IsString()
  @IsNotEmpty()
  plaka: string;

  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @IsNotEmpty()
  sofor_adi: string;

  @ApiPropertyOptional({ example: '+90 555 123 4567' })
  @IsOptional()
  @IsString()
  sofor_telefon?: string;

  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @IsNumber()
  ic_uzunluk_mm?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  ic_genislik_mm?: number;

  @ApiPropertyOptional({ example: 2700 })
  @IsOptional()
  @IsNumber()
  ic_yukseklik_mm?: number;

  @ApiProperty({ example: 20000 })
  @IsNumber()
  max_agirlik_kg: number;

  @ApiPropertyOptional({ example: 33 })
  @IsOptional()
  @IsNumber()
  palet_kapasitesi?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}