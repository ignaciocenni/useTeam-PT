import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardSchema, Board } from './board.schema';
import { ColumnSchema, Column } from './column.schema';
import { CardSchema, Card } from './card.schema';
@Module({
  imports: [
    // Importamos los schemas para que Mongoose sepa qué Modelos usar.
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Column.name, schema: ColumnSchema },
      { name: Card.name, schema: CardSchema },
    ]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  // Exportamos el service para que otros módulos (si los hubiera) puedan usarlo.
  exports: [BoardsService],
})
export class BoardsModule {}
