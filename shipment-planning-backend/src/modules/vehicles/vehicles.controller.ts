import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VehicleStatus } from './vehicle.entity';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni araç ekle' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm araçları listele' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Müsait araçları listele' })
  async findAvailable() {
    return this.service.findAvailable();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Araç detayı' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Araç bilgilerini güncelle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateVehicleDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Araç durumunu güncelle' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: VehicleStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aracı pasife al' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}