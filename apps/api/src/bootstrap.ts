import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

export function configureApplication(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow<string>('WEB_URL'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new HttpLoggingInterceptor(), new ResponseInterceptor());

  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', false);

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Kurvenfunk API')
      .setDescription('OpenAPI documentation for the Kurvenfunk API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs/openapi.json',
    });
  }
}
