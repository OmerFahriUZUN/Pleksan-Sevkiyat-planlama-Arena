import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'ERP acik siparisler (Read-Only)' })
  async getOpenOrders() {
    return this.service.getOpenOrders();
  }

  @Get('pending-shipment')
  @ApiOperation({ summary: 'Sevkiyat bekleyen siparisler' })
  async getPending() {
    return this.service.getPendingShipmentOrders();
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Siparis detayi' })
  async getById(@Param('orderId') orderId: string) {
    return this.service.getOrderById(orderId);
  }
}