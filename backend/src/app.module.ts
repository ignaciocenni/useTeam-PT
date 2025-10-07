import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BoardsModule } from './boards/boards.module';

@Module({
  imports: [
    // 1. Módulos de Configuración y DB (tus configuraciones previas)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Usamos una variable de entorno o un fallback
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/useteam',
      }),
      inject: [ConfigService],
    }),

    BoardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
