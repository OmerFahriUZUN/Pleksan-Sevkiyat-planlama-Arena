import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'ERP musterileri (Read-Only)' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Musteri detayi' })
  async findById(@Param('customerId') customerId: string) {
    return this.service.findById(customerId);
  }

  @Get(':customerId/history')
  @ApiOperation({ summary: 'Musteri sevkiyat gecmisi' })
  async getHistory(@Param('customerId') customerId: string) {
    return this.service.getShipmentHistory(customerId);
  }
}