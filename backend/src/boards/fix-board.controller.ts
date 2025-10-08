import { Controller, Post, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board } from './board.schema';
import { Column } from './column.schema';

@Controller('fix')
export class FixBoardController {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<Board>,
    @InjectModel(Column.name) private columnModel: Model<Column>,
  ) {}

  @Post('board/:boardId')
  async fixBoard(@Param('boardId') boardId: string) {
    console.log('[FIX] =====================================');
    console.log('[FIX] Arreglando board:', boardId);

    // TRAER TODAS LAS COLUMNAS Y FILTRAR EN MEMORIA
    const allColumns = await this.columnModel
      .find({})
      .select('_id title boardId')
      .exec();

    console.log('[FIX] Total columnas en BD:', allColumns.length);

    // Filtrar las que coinciden con nuestro boardId (comparando como strings)
    const columns = allColumns.filter((col) => {
      const colBoardId = (col as any).boardId.toString();
      const match = colBoardId === boardId;
      if (match) {
        console.log(`[FIX] ✅ Match encontrado: ${col.title}`);
      }
      return match;
    });

    console.log('[FIX] Columnas que coinciden:', columns.length);

    columns.forEach((col) => {
      console.log(`[FIX]   - ${col.title} (${col._id})`);
    });

    if (columns.length === 0) {
      console.error('[FIX] ❌ No se encontraron columnas para este board');
      return {
        success: false,
        boardId,
        columnsFixed: 0,
        error: 'No se encontraron columnas para este board',
      };
    }

    // Extraer los IDs
    const columnIds = columns.map((col) => col._id);

    console.log('[FIX] IDs de columnas a agregar:', columnIds);

    // Actualizar el board
    const boardObjectId = new Types.ObjectId(boardId);
    const result = await this.boardModel
      .updateOne({ _id: boardObjectId }, { $set: { columns: columnIds } })
      .exec();

    console.log('[FIX] ✅ Board actualizado');
    console.log('[FIX] MongoDB updateOne result:', JSON.stringify(result));

    return {
      success: true,
      boardId,
      columnsFixed: columns.length,
      columns: columns.map((c) => ({
        id: c._id,
        title: c.title,
      })),
    };
  }
}
