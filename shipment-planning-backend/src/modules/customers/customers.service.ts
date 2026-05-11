import { Injectable } from '@nestjs/common';
import { ErpApiService } from '../erp/erp-api.service';

@Injectable()
export class CustomersService {
  constructor(private readonly erpApi: ErpApiService) {}

  async findAll(search?: string) {
    return this.erpApi.getCustomers(search);
  }

  async findById(customerId: string) {
    return this.erpApi.getCustomerById(customerId);
  }

  async getShipmentHistory(customerId: string) {
    return this.erpApi.getCustomerShipmentHistory(customerId);
  }
}