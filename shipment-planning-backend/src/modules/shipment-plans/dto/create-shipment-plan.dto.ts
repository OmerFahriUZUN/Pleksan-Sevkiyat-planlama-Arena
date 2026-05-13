import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentPriority } from '../shipment-plan.entity';

export class OrderProductDto {
  @ApiProperty({ example: 'STK-001' })
  @IsString()
  @IsNotEmpty()
  stok_kodu: string;

  @ApiProperty({ example: 'Çelik Boru DN100' })
  @IsString()
  @IsNotEmpty()
  stok_adi: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  miktar: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  kalan_miktar: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  koli_sayisi?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  palet_sayisi?: number;

  @ApiProperty({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  hacim_m3?: number;

  @ApiProperty({ example: 150 })
  @IsOptional()
  @IsNumber()
  agirlik?: number;

  @ApiProperty({ example: 'DEPO-01' })
  @IsOptional()
  @IsString()
  depo_kodu?: string;
}

export class CreateShipmentPlanDto {
  @ApiProperty({ example: 'SHP-2024-001' })
  @IsString()
  @IsNotEmpty()
  sevkiyat_no: string;

  @ApiProperty({ example: 'ORD-00123' })
  @IsString()
  @IsNotEmpty()
  siparis_no: string;

  @ApiProperty({ example: 'YURTICI' })
  @IsString()
  @IsNotEmpty()
  kart_bilgisi: string;

  @ApiProperty({ example: 'CARI-001' })
  @IsString()
  @IsNotEmpty()
  cari_kod: string;

  @ApiProperty({ example: 'Müşteri A.Ş.' })
  @IsString()
  @IsNotEmpty()
  cari_ad: string;

  @ApiPropertyOptional({ example: 'İstanbul Merkez' })
  @IsOptional()
  @IsString()
  nakliye_yeri?: string;

  @ApiPropertyOptional({ example: 'Türkiye' })
  @IsOptional()
  @IsString()
  cari_ulke?: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  cari_sehir?: string;

  @ApiPropertyOptional({ example: 'Kadıköy' })
  @IsOptional()
  @IsString()
  cari_ilce?: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  termin_tarihi: string;

  @ApiPropertyOptional({ example: '2024-12-01' })
  @IsOptional()
  @IsDateString()
  sevkiyat_tarihi?: string;

  @ApiPropertyOptional({ example: 'Teslimat Adresi, Mahalle, Sokak No:5' })
  @IsOptional()
  @IsString()
  teslimat_adresi?: string;

  @ApiPropertyOptional({ enum: ShipmentPriority, example: ShipmentPriority.NORMAL })
  @IsOptional()
  @IsEnum(ShipmentPriority)
  priority?: ShipmentPriority;

  @ApiPropertyOptional({ type: [OrderProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  urun_listesi?: OrderProductDto[];
}