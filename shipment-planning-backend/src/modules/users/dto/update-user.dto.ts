import { IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  @ValidateIf((o) => o.password !== undefined && o.password !== '')
  @IsString()
  @MinLength(6)
  password?: string;
}