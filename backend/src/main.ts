import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configuramos el ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      // Permite que solo las propiedades definidas en el DTO pasen.
      // Si envían datos extra, serán descartados. ¡Mejor seguridad!
      whitelist: true,
    }),
  );

  // Configuramos el prefijo global (opcional, pero buena práctica)
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
