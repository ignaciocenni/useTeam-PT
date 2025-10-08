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
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    // 1. Lógica del Service: Crea la tarjeta y la guarda en DB
    const newCard = await this.boardsService.createCard(
      boardId,
      columnId,
      createCardDto.title,
      createCardDto.description,
      createCardDto.position,
    );

    // El evento WebSocket ya se emite desde el service
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
    // 💡 FIX CRÍTICO: Necesitamos todos los IDs de la URL
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Param('cardId') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    // 💡 FIX: Llamada correcta al Service con los 4 argumentos
    const updatedCard = await this.boardsService.updateCard(
      boardId,
      columnId,
      cardId,
      updateCardDto,
    );

    // NOTA: La emisión del evento 'cardMoved' ya está en BoardsService,
    // pero si deseas emitir otros eventos aquí (como 'cardTitleUpdated'),
    // puedes usar this.boardsGateway.emitBoardUpdate(eventName, updatedCard);

    return updatedCard;
  }

  // ==================== DELETE /.../cards/:cardId ====================
  @Delete(':cardId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('cardId') cardId: string,
    // 💡 IMPORTANTE: Si necesitas emitir el WS, también debes capturar el boardId y columnId
    // @Param('boardId') boardId: string,
    // @Param('columnId') columnId: string,
  ) {
    // OPCIÓN MÁS LIMPIA: No asignamos la variable
    await this.boardsService.deleteCard(cardId);

    // EMITIR EVENTO: Notificamos que se eliminó una tarjeta
    this.boardsGateway.emitBoardUpdate('cardDeleted', { id: cardId });

    return { status: 200, message: 'Tarjeta eliminada con éxito.' };
  }
}
