import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { ColumnsController } from './columns.controller';
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
  controllers: [BoardsController, ColumnsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
