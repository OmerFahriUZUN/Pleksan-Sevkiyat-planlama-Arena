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
import { UpdateShipmentTaskDto } from './dto/shipment-plan-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShipmentStatus } from './shipment-plan.entity';

@ApiTags('Shipment Plans')
@ApiBearerAuth()
@Controller('shipment-plans')
export class ShipmentPlansController {
  constructor(private readonly service: ShipmentPlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Yeni sevkiyat planı oluştur' })
  async create(@Body() dto: CreateShipmentPlanDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Dashboard istatistikleri' })
  async getDashboard() {
    return this.service.getDashboardStats();
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Sevkiyat planı görevleri' })
  @ApiParam({ name: 'id', type: 'string' })
  async getTasks(@Param('id', ParseUUIDPipe) id: string) {
    const plan = await this.service.findOne(id);
    return plan.workflowTasks ?? [];
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Sevkiyat planı detayı' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Sevkiyat planı görevi güncelle' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'taskId', type: 'string' })
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateShipmentTaskDto,
  ) {
    return this.service.updateTask(id, taskId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Sevkiyat planı güncelle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentPlanDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Plan durumunu güncelle' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ShipmentStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sevkiyat planı sil (sadece taslak)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}