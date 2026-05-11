import { Injectable } from '@nestjs/common';
import { ErpApiService } from '../erp/erp-api.service';

@Injectable()
export class OrdersService {
  constructor(private readonly erpApi: ErpApiService) {}

  async getOpenOrders() {
    return this.erpApi.getOpenOrders();
  }

  async getOrderById(orderId: string) {
    return this.erpApi.getOrderById(orderId);
  }

  async getPendingShipmentOrders() {
    return this.erpApi.getPendingShipmentOrders();
  }
}