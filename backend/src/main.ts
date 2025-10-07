import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  // Validación global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS - Permite que el frontend se conecte
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
