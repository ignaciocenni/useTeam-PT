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
import { BoardsService } from './boards.service';
import { BoardsGateway } from './boards.gateway';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

// La ruta anidada: /boards/:boardId/columns/:columnId/cards
@Controller('boards/:boardId/columns/:columnId/cards')
export class CardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly boardsGateway: BoardsGateway,
  ) {}

  // ==================== POST /.../cards ====================
  @Post()
  async create(
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    // 1. Lógica del Service: Crea la tarjeta y la guarda en DB
    const newCard = await this.boardsService.createCard(
      columnId,
      createCardDto.title,
      createCardDto.description,
      createCardDto.position,
    );

    // LÓGICA DE TIEMPO REAL: Emitir el evento WebSocket
    this.boardsGateway.emitBoardUpdate('cardCreated', newCard); // PENDIENTE: Usar un ID de Tablero si fuera más específico

    return newCard;
  }

  // ==================== GET /.../:columnId/cards ====================
  // Obtiene todas las tarjetas de una columna específica
  @Get()
  async findAll(@Param('columnId') columnId: string) {
    return this.boardsService.getCardsByColumn(columnId);
  }

  // ==================== PATCH /.../cards/:cardId ====================
  @Patch(':cardId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('cardId') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    const updatedCard = await this.boardsService.updateCard(
      cardId,
      updateCardDto,
    );

    // EMITIR EVENTO: Notificamos una actualización (incluye movimiento de posición o columna)
    this.boardsGateway.emitBoardUpdate('cardUpdated', updatedCard);

    return updatedCard;
  }

  // ==================== DELETE /.../cards/:cardId ====================
  @Delete(':cardId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('cardId') cardId: string) {
    // OPCIÓN MÁS LIMPIA: No asignamos la variable
    await this.boardsService.deleteCard(cardId);

    // EMITIR EVENTO: Notificamos que se eliminó una tarjeta
    this.boardsGateway.emitBoardUpdate('cardDeleted', { id: cardId });

    return { status: 200, message: 'Tarjeta eliminada con éxito.' };
  }
}
