import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const swaggerPath = 'api';
  
  // Prevent CDN/browser caching of Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Chat Application API')
    .setDescription('A comprehensive chat application backend with real-time messaging, disappearing messages, and group chats')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui { background-color: #f8f9fa; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { 
        font-size: 36px; 
        color: #1a202c;
        font-weight: 700;
        margin-bottom: 10px;
      }
      .swagger-ui .info .description { 
        font-size: 16px; 
        color: #4a5568;
        line-height: 1.6;
      }
      .swagger-ui .opblock { 
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .swagger-ui .opblock-tag { 
        font-size: 20px; 
        font-weight: 600;
        color: #2d3748;
        border-bottom: 2px solid #e2e8f0;
        padding: 15px 20px;
        background-color: #ffffff;
      }
      .swagger-ui .opblock .opblock-summary-method {
        font-weight: 700;
        min-width: 80px;
        border-radius: 4px;
        text-align: center;
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #48bb78; 
        background-color: rgba(72, 187, 120, 0.03);
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #4299e1; 
        background-color: rgba(66, 153, 225, 0.03);
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #ed8936; 
        background-color: rgba(237, 137, 54, 0.03);
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #f56565; 
        background-color: rgba(245, 101, 101, 0.03);
      }
      .swagger-ui .btn.execute { 
        background-color: #4299e1;
        border-color: #4299e1;
        color: white;
        font-weight: 600;
        padding: 10px 20px;
        border-radius: 6px;
      }
      .swagger-ui .btn.execute:hover { 
        background-color: #3182ce;
        border-color: #3182ce;
      }
      .swagger-ui .response-col_status { 
        font-weight: 700;
      }
      .swagger-ui .responses-inner h4, 
      .swagger-ui .responses-inner h5 { 
        font-weight: 600;
        color: #2d3748;
      }
      .swagger-ui .scheme-container { 
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .swagger-ui .authorization__btn { 
        background-color: #48bb78;
        border-color: #48bb78;
        color: white;
        font-weight: 600;
        border-radius: 6px;
      }
      .swagger-ui .authorization__btn:hover { 
        background-color: #38a169;
      }
      .swagger-ui .parameter__name { 
        font-weight: 600;
        color: #2d3748;
      }
      .swagger-ui table thead tr td, 
      .swagger-ui table thead tr th { 
        font-weight: 700;
        color: #1a202c;
      }
    `,
    customSiteTitle: 'Chat Application API',
    customfavIcon: 'https://cdn-icons-png.flaticon.com/512/134/134914.png',
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/${swaggerPath}`);
  logger.log(`💬 WebSocket Gateway available at: ws://localhost:${port}/chat`);
}

bootstrap();
