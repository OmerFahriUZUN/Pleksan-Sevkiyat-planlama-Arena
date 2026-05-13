import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto, UpdatePersonnelDto } from './dto/create-personnel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Personnel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('personnel')
export class PersonnelController {
  constructor(private readonly service: PersonnelService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni personel ekle' })
  async create(@Body() dto: CreatePersonnelDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm personelleri listele' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Role göre personelleri listele' })
  async findByRole(@Param('role') role: string) {
    return this.service.findByRole(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Personel detayı' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Personel güncelle' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePersonnelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Personeli pasife al' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get(':id/check-shift/:saat')
  @ApiOperation({ summary: 'Personelin vardiyada olup olmadığını kontrol et' })
  async checkShift(@Param('id', ParseUUIDPipe) id: string, @Param('saat') saat: string) {
    const isWithin = await this.service.isWithinShift(id, saat);
    return { personel_id: id, saat, vardiyada: isWithin };
  }
}