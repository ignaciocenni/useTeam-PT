import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { ColumnsController } from './columns.controller';
import { CardsController } from './cards.controller';
import { ExportController } from './export.controller'; // 👈 NUEVO
import { BoardsService } from './boards.service';
import { BoardsGateway } from './boards.gateway';
import { BoardSchema, Board } from './board.schema';
import { ColumnSchema, Column } from './column.schema';
import { CardSchema, Card } from './card.schema';
import { FixBoardController } from './fix-board.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Column.name, schema: ColumnSchema },
      { name: Card.name, schema: CardSchema },
    ]),
  ],
  controllers: [
    BoardsController,
    ColumnsController,
    CardsController,
    ExportController,
    FixBoardController,
  ],
  providers: [BoardsService, BoardsGateway],
  exports: [BoardsService, BoardsGateway],
})
export class BoardsModule {}
