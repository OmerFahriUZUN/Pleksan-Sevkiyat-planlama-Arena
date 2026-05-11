import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ShipmentPlansService } from './shipment-plans.service';
import { CreateShipmentPlanDto } from './dto/create-shipment-plan.dto';
import { UpdateShipmentPlanDto } from './dto/update-shipment-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShipmentStatus } from './shipment-plan.entity';

@ApiTags('Shipment Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipment-plans')
export class ShipmentPlansController {
  constructor(private readonly service: ShipmentPlansService) {}

  @Post()
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Yeni sevkiyat planı oluştur' })
  async create(@Body() dto: CreateShipmentPlanDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm sevkiyat planlarını listele' })
  @ApiQuery({ name: 'status', enum: ShipmentStatus, required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'customerId', required: false })
  async findAll(
    @Query('status') status?: ShipmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.service.findAll({ status, dateFrom, dateTo, customerId });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard istatistikleri' })
  async getDashboard() {
    return this.service.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sevkiyat planı detayı' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Sevkiyat planı güncelle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentPlanDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Plan durumunu güncelle' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ShipmentStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sevkiyat planı sil (sadece taslak)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}