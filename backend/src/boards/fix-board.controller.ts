import { Controller, Post, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board } from './board.schema';
import { Column } from './column.schema';
import { Card } from './card.schema';

@Controller('fix')
export class FixBoardController {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<Board>,
    @InjectModel(Column.name) private columnModel: Model<Column>,
    @InjectModel(Card.name) private cardModel: Model<Card>, // 👈 AGREGAR
  ) {}

  @Post('columns/:boardId')
  async fixColumns(@Param('boardId') boardId: string) {
    console.log('[FIX COLUMNS] ====================================');
    console.log('[FIX COLUMNS] Arreglando columnas del board:', boardId);

    // 1. Traer todas las columnas del board
    const allColumns = await this.columnModel
      .find({})
      .select('_id title boardId cards')
      .exec();

    const columns = allColumns.filter((col) => {
      const colBoardId = (col as any).boardId.toString();
      return colBoardId === boardId;
    });

    console.log('[FIX COLUMNS] Columnas encontradas:', columns.length);

    let totalCardsFixed = 0;

    // 2. Para cada columna, buscar sus tarjetas
    for (const column of columns) {
      console.log(
        `[FIX COLUMNS] Procesando columna: ${column.title} (${column._id})`,
      );

      // Buscar todas las tarjetas que pertenecen a esta columna
      const cards = await this.cardModel
        .find({ columnId: column._id })
        .select('_id title')
        .exec();

      console.log(`[FIX COLUMNS]   - Tarjetas encontradas: ${cards.length}`);

      if (cards.length > 0) {
        const cardIds = cards.map((card) => card._id);

        // Actualizar la columna con las tarjetas
        await this.columnModel
          .updateOne({ _id: column._id }, { $set: { cards: cardIds } })
          .exec();

        console.log(
          `[FIX COLUMNS]   - ✅ Columna actualizada con ${cards.length} tarjetas`,
        );
        totalCardsFixed += cards.length;

        cards.forEach((card) => {
          console.log(`[FIX COLUMNS]     * ${card.title}`);
        });
      }
    }

    console.log('[FIX COLUMNS] ✅ Proceso completado');
    console.log(`[FIX COLUMNS] Total tarjetas asociadas: ${totalCardsFixed}`);

    return {
      success: true,
      boardId,
      columnsFixed: columns.length,
      totalCardsFixed,
      message: `Se actualizaron ${columns.length} columnas con ${totalCardsFixed} tarjetas`,
    };
  }
}
