import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode, // Necesario para DELETE/PATCH (mejor semántica)
  HttpStatus, // Necesario para el código de estado
} from '@nestjs/common';
import { BoardsService } from './boards.service'; // Usamos el service existente
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

// La ruta indica que este controller gestiona '/boards/:boardId/columns'
@Controller('boards/:boardId/columns')
export class ColumnsController {
  constructor(private readonly boardsService: BoardsService) {}

  // ==================== POST /boards/:boardId/columns ====================
  // Crea una columna en el tablero especificado
  @Post()
  async create(
    @Param('boardId') boardId: string, // Captura el ID del tablero de la URL
    @Body() createColumnDto: CreateColumnDto, // Captura el título y posición
  ) {
    // El service combina el ID de la URL con los datos del body
    return this.boardsService.createColumn(
      boardId,
      createColumnDto.title,
      createColumnDto.position,
    );
  }

  // ==================== GET /boards/:boardId/columns ====================
  // Obtiene todas las columnas de un tablero específico
  @Get()
  async findAll(@Param('boardId') boardId: string) {
    return this.boardsService.getColumnsByBoard(boardId);
  }

  // ==================== PATCH /boards/:boardId/columns/:columnId ====================
  // Actualiza una columna (solo título o posición)
  @Patch(':columnId') // Añadimos un segundo parámetro de ruta
  @HttpCode(HttpStatus.OK) // Siempre devolver 200 para PATCH (éxito)
  async update(
    @Param('columnId') columnId: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.boardsService.updateColumn(columnId, updateColumnDto);
  }

  // ==================== DELETE /boards/:boardId/columns/:columnId ====================
  // Elimina una columna
  @Delete(':columnId')
  @HttpCode(HttpStatus.OK) // Devolver 200 en DELETE (éxito)
  async remove(@Param('columnId') columnId: string) {
    await this.boardsService.deleteColumn(columnId);
    return { status: 200, message: 'Columna eliminada con éxito.' };
  }
}
