import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'planner01' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'planner@pleksan.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.VIEWER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}