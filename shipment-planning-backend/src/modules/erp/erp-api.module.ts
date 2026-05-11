import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErpApiService } from './erp-api.service';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('ERP_API_TIMEOUT', 10000),
        maxRedirects: 3,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ErpApiService],
  exports: [ErpApiService],
})
export class ErpApiModule {}