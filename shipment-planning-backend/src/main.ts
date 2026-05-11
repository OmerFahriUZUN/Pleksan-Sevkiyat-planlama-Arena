import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: (origin, callback) => {
      // Tüm localhost ve 127.0.0.1 portlarına izin ver
      const allowedOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
      const isAllowed = !origin || allowedOrigins.some(pattern => pattern.test(origin));
      callback(null, isAllowed);
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Pleksan Shipment Planning MES API')
    .setDescription('MES Sevkiyat Planlama Sistemi REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Shipment Plans')
    .addTag('Orders')
    .addTag('Products')
    .addTag('Vehicles')
    .addTag('Customers')
    .addTag('Reports')
    .addTag('Users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Pleksan MES Backend: http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();