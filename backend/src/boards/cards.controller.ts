import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BoardsService } from './boards.service'; // Usamos el service existente
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

// La ruta anidada: /boards/:boardId/columns/:columnId/cards
@Controller('boards/:boardId/columns/:columnId/cards')
export class CardsController {
  constructor(private readonly boardsService: BoardsService) {}

  // 🆕==================== POST /.../:columnId/cards ====================
  // Crea una tarjeta en la columna especificada
  @Post()
  async create(
    @Param('columnId') columnId: string, // Captura el ID de la columna
    @Body() createCardDto: CreateCardDto,
  ) {
    // Mapeamos el DTO a los argumentos que espera el service
    return this.boardsService.createCard(
      columnId,
      createCardDto.title,
      createCardDto.description,
      createCardDto.position,
    );
  }

  // ==================== GET /.../:columnId/cards ====================
  // Obtiene todas las tarjetas de una columna específica
  @Get()
  async findAll(@Param('columnId') columnId: string) {
    return this.boardsService.getCardsByColumn(columnId);
  }

  // ==================== PATCH /.../cards/:cardId ====================
  // Actualiza una tarjeta (renombrar, cambiar descripción, mover posición o columna)
  // Nota: Mover a otra columna se maneja enviando { columnId: "nuevo_id" } en el body
  @Patch(':cardId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('cardId') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    // updateCard espera el DTO (UpdateCardDto hereda de Partial<Card> por el mapped-types)
    return this.boardsService.updateCard(cardId, updateCardDto);
  }

  // ==================== DELETE /.../cards/:cardId ====================
  // Elimina una tarjeta
  @Delete(':cardId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('cardId') cardId: string) {
    await this.boardsService.deleteCard(cardId);
    return { status: 200, message: 'Tarjeta eliminada con éxito.' };
  }
}
