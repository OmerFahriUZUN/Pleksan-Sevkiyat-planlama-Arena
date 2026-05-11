import { Injectable } from '@nestjs/common';
import { ErpApiService } from '../erp/erp-api.service';

@Injectable()
export class ProductsService {
  constructor(private readonly erpApi: ErpApiService) {}

  async findAll(search?: string) {
    return this.erpApi.getProducts(search);
  }

  async findById(productId: string) {
    return this.erpApi.getProductById(productId);
  }

  async getStockLevels() {
    return this.erpApi.getStockLevels();
  }
}