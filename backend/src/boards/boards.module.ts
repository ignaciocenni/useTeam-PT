import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board, BoardSchema } from './board.schema';
import { Column, ColumnSchema } from './column.schema';
import { Card, CardSchema } from './card.schema';

@Module({
  imports: [
    // Registramos los schemas en Mongoose
    // Esto crea automáticamente los Models
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Column.name, schema: ColumnSchema },
      { name: Card.name, schema: CardSchema },
    ]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService], // Exportamos el service por si otros módulos lo necesitan
})
export class BoardsModule {}
