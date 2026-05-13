import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonnelRole } from '../personnel.entity';

export class CreatePersonnelDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @IsNotEmpty()
  ad_soyad: string;

  @ApiProperty({ enum: PersonnelRole, example: PersonnelRole.PICKER })
  @IsEnum(PersonnelRole)
  role: PersonnelRole;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  vardiya_baslangic: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @IsNotEmpty()
  vardiya_bitis: string;
}

export class UpdatePersonnelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ad_soyad?: string;

  @ApiPropertyOptional({ enum: PersonnelRole })
  @IsOptional()
  @IsEnum(PersonnelRole)
  role?: PersonnelRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vardiya_baslangic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vardiya_bitis?: string;
}