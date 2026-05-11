import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'ERP urunleri (Read-Only)' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Stok seviyeleri' })
  async getStock() {
    return this.service.getStockLevels();
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Urun detayi' })
  async findById(@Param('productId') productId: string) {
    return this.service.findById(productId);
  }
}