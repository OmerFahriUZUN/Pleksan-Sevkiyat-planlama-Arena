import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ErpApiService {
  private readonly logger = new Logger(ErpApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('ERP_API_BASE_URL', 'http://localhost');
    const port = this.configService.get<string>('ERP_API_PORT', '8080');
    this.baseUrl = `${host}:${port}`;
    this.apiKey = this.configService.get<string>('ERP_API_KEY', '');
    this.timeout = this.configService.get<number>('ERP_API_TIMEOUT', 10000);
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      headers: this.getHeaders(),
      timeout: this.timeout,
      params,
    };

    try {
      this.logger.log(`ERP GET: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get<T>(url, config),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `ERP API hatasi [GET ${url}]: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `ERP servisi yanit vermedi: ${error.message}`,
      );
    }
  }

  // Siparisler
  async getOpenOrders(): Promise<any[]> {
    return this.get<any[]>('/api/orders', { status: 'open' });
  }

  async getOrderById(orderId: string): Promise<any> {
    return this.get<any>(`/api/orders/${orderId}`);
  }

  async getPendingShipmentOrders(): Promise<any[]> {
    return this.get<any[]>('/api/orders', { status: 'pending-shipment' });
  }

  // Urunler
  async getProducts(search?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (search) params.search = search;
    return this.get<any[]>('/api/products', params);
  }

  async getProductById(productId: string): Promise<any> {
    return this.get<any>(`/api/products/${productId}`);
  }

  async getStockLevels(): Promise<any[]> {
    return this.get<any[]>('/api/products/stock');
  }

  // Musteriler
  async getCustomers(search?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (search) params.search = search;
    return this.get<any[]>('/api/customers', params);
  }

  async getCustomerById(customerId: string): Promise<any> {
    return this.get<any>(`/api/customers/${customerId}`);
  }

  async getCustomerShipmentHistory(customerId: string): Promise<any[]> {
    return this.get<any[]>(`/api/customers/${customerId}/orders`);
  }
}