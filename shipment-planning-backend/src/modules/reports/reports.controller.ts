import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Gunluk sevkiyat raporu' })
  @ApiQuery({ name: 'date', required: false, example: '2024-12-01' })
  async daily(@Query('date') date: string) {
    const target = date || new Date().toISOString().slice(0, 10);
    return this.service.getDailyShipmentReport(target);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Aylik sevkiyat raporu' })
  @ApiQuery({ name: 'year', required: true, example: 2024 })
  @ApiQuery({ name: 'month', required: true, example: 12 })
  async monthly(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.service.getMonthlyReport(Number(year), Number(month));
  }

  @Get('vehicle-utilization')
  @ApiOperation({ summary: 'Arac kullanim raporu' })
  @ApiQuery({ name: 'dateFrom', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'dateTo', required: true, example: '2024-12-31' })
  async vehicleUtil(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.service.getVehicleUtilizationReport(dateFrom, dateTo);
  }
}