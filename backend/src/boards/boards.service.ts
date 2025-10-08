import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateCardDto } from './dto/update-card.dto'; // 💡 FIX: Import de UpdateCardDto
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board } from './board.schema';
import { BoardsGateway } from './boards.gateway';
import { Column } from './column.schema';
import { Card } from './card.schema';

@Injectable()
export class BoardsService {
  constructor(
    // Inyectamos los 3 Models que creó Mongoose
    @InjectModel(Board.name) private boardModel: Model<Board>,
    @InjectModel(Column.name) private columnModel: Model<Column>,
    @InjectModel(Card.name) private cardModel: Model<Card>,
    // 💡 FIX: Inyección correcta y única del Gateway
    private readonly boardsGateway: BoardsGateway,
  ) {}

  // ==================== BOARDS ====================

  // Crear un nuevo tablero
  // REFACTORIZADO para recibir el DTO completo, siguiendo la convención de NestJS
  async createBoard(createBoardDto: CreateBoardDto) {
    const newBoard = new this.boardModel(createBoardDto); // Pasamos el objeto directamente
    return await newBoard.save();
  }

  // Obtener un tablero completo con sus columnas y tarjetas (para exportar)
  async getBoard(boardId: string) {
    console.log('[GET BOARD] =====================================');
    console.log('[GET BOARD] Buscando board:', boardId);

    const board = await this.boardModel
      .findById(boardId)
      .populate({
        path: 'columns',
        model: 'Column', // 👈 CRÍTICO: Especificar el modelo
        populate: {
          path: 'cards',
          model: 'Card', // 👈 CRÍTICO: Especificar el modelo
          options: { sort: { position: 1 } },
        },
      })
      .exec();

    if (!board) {
      throw new Error('Board no encontrado');
    }

    console.log('[GET BOARD] ✅ Board encontrado:', board._id);
    console.log('[GET BOARD] Título:', board.title);
    console.log('[GET BOARD] Número de columnas:', board.columns?.length || 0);

    // Log detallado de CADA columna
    if (board.columns && Array.isArray(board.columns)) {
      board.columns.forEach((col: any, index: number) => {
        console.log(`[GET BOARD] Columna ${index + 1}:`);
        console.log(`  - ID: ${col._id}`);
        console.log(`  - Título: ${col.title}`);
        console.log(`  - Cards: ${col.cards?.length || 0}`);

        if (col.cards && col.cards.length > 0) {
          col.cards.forEach((card: any, cardIndex: number) => {
            console.log(
              `    Card ${cardIndex + 1}: ${card.title} (${card._id})`,
            );
          });
        }
      });
    } else {
      console.log('[GET BOARD] ⚠️ board.columns no es un array o está vacío');
    }

    return board;
  }

  // Obtener todos los tableros
  async getAllBoards() {
    return await this.boardModel.find().exec(); // .find() sin parámetros = todos los documentos
  }

  // Obtener un tablero por ID
  async getBoardById(id: string): Promise<Board> {
    // SOLUCIÓN: Usamos .populate() para obtener las columnas anidadas.
    // 'columns' es el nombre de la propiedad en el esquema de Board.
    const board = await this.boardModel
      .findById(id)
      .populate({
        path: 'columns', // Hacemos populate de las Columnas
        model: 'Column', // Nombre del modelo de Columnas (Mongoose)
        // 💡 CRÍTICO: Anidamos otro populate para que cada Columna traiga sus Tarjetas.
        populate: {
          path: 'cards',
          model: 'Card', // Nombre del modelo de Tarjetas (Mongoose)
        },
      })
      .exec(); // Ejecutamos la consulta

    if (!board) {
      throw new NotFoundException(`Board with ID \"${id}\" not found`);
    }

    return board;
  }

  // Actualizar un tablero
  async updateBoard(boardId: string, updates: UpdateBoardDto) {
    // findByIdAndUpdate: Busca por ID, aplica los 'updates' y devuelve el resultado.
    return await this.boardModel
      .findByIdAndUpdate(boardId, updates, {
        new: true, // CLAVE: Devuelve el documento DESPUÉS de la actualización (el que tiene los cambios).
      })
      .exec();
  }

  // Eliminar un tablero
  async deleteBoard(boardId: string) {
    return await this.boardModel.findByIdAndDelete(boardId).exec();
  }

  // ==================== COLUMNS ====================

  // Crear una columna en un tablero
  async createColumn(boardId: string, title: string, position: number) {
    // 1. Crear y guardar la columna
    const newColumn = new this.columnModel({
      boardId,
      title,
      position,
    });
    const savedColumn = await newColumn.save(); // Guardamos el resultado

    // FIX CRÍTICO: Vinculamos la columna al tablero padre.
    // Usamos $push para añadir el ID de la columna al array 'columns' del Board.
    await this.boardModel.findByIdAndUpdate(
      boardId,
      { $push: { columns: savedColumn._id } },
      { new: true },
    );

    // 2. Devolver la columna creada
    return savedColumn; // Devolvemos la columna con su _id
  }

  // Obtener todas las columnas de un tablero
  async getColumnsByBoard(boardId: string) {
    return await this.columnModel
      .find({ boardId })
      .sort({ position: 1 })
      .exec();
    // .sort({ position: 1 }) = ordenar por posición ascendente
  }

  // Actualizar una columna
  async updateColumn(columnId: string, updates: UpdateColumnDto) {
    return await this.columnModel
      .findByIdAndUpdate(columnId, updates, {
        new: true, // Devuelve el documento DESPUÉS de la actualización
      })
      .exec();
  }

  // Eliminar una columna
  async deleteColumn(columnId: string) {
    return await this.columnModel.findByIdAndDelete(columnId).exec();
  }

  // ==================== CARDS ====================

  // Crear una tarjeta en una columna
  async createCard(
    boardId: string,
    columnId: string,
    title: string,
    description?: string,
    position?: number,
  ) {
    const newCard = new this.cardModel({
      columnId,
      title,
      description,
      position: position || 0,
    });

    const savedCard = await newCard.save();

    // Emitir evento al board específico
    this.boardsGateway.emitToBoard(boardId, 'cardCreated', {
      card: savedCard.toObject(),
      boardId,
      timestamp: new Date().toISOString(),
    });

    return savedCard;
  }

  // Obtener todas las tarjetas de una columna
  async getCardsByColumn(columnId: string) {
    return await this.cardModel.find({ columnId }).sort({ position: 1 }).exec();
  }

  // Actualizar una tarjeta (moverla de columna o cambiar posición)
  async updateCard(
    boardId: string,
    columnId: string,
    cardId: string,
    updateCardDto: any,
  ) {
    try {
      console.log('[UPDATE CARD] =====================================');
      console.log('[UPDATE CARD] boardId:', boardId);
      console.log('[UPDATE CARD] columnId (origen):', columnId);
      console.log('[UPDATE CARD] cardId:', cardId);
      console.log('[UPDATE CARD] updates:', updateCardDto);

      // 1. Buscar la tarjeta actual
      const card = await this.cardModel.findById(cardId).exec();
      if (!card) {
        throw new Error('Card no encontrada');
      }

      const oldColumnId = card.columnId.toString();
      const newColumnId = updateCardDto.columnId || oldColumnId;
      const movingToAnotherColumn = oldColumnId !== newColumnId;

      console.log('[UPDATE CARD] oldColumnId:', oldColumnId);
      console.log('[UPDATE CARD] newColumnId:', newColumnId);
      console.log('[UPDATE CARD] ¿Cambio de columna?:', movingToAnotherColumn);

      // 2. Actualizar los campos de la tarjeta
      Object.assign(card, updateCardDto);
      await card.save();

      console.log('[UPDATE CARD] ✅ Card actualizada en BD');

      // 3. Si cambió de columna, actualizar los arrays de ambas columnas
      if (movingToAnotherColumn) {
        // Remover de la columna origen
        await this.columnModel
          .updateOne({ _id: oldColumnId }, { $pull: { cards: cardId } })
          .exec();
        console.log('[UPDATE CARD] ✅ Card removida de columna origen');

        // Agregar a la columna destino
        await this.columnModel
          .updateOne(
            { _id: newColumnId },
            { $addToSet: { cards: cardId } }, // addToSet evita duplicados
          )
          .exec();
        console.log('[UPDATE CARD] ✅ Card agregada a columna destino');
      }

      // 4. Emitir evento WebSocket
      this.boardsGateway.emitToBoard(boardId, 'cardMoved', {
        card: {
          _id: card._id,
          title: card.title,
          description: card.description,
          position: card.position,
          columnId: card.columnId,
          createdAt: (card as any).createdAt,
        },
        sourceColumnId: oldColumnId,
        destinationColumnId: newColumnId,
        boardId,
        timestamp: new Date().toISOString(),
      });

      console.log('[UPDATE CARD] ✅ Evento WebSocket emitido');

      return card;
    } catch (error: any) {
      console.error('[UPDATE CARD] ❌ Error:', error.message);
      throw error;
    }
  }

  // Eliminar una tarjeta
  async deleteCard(cardId: string) {
    return await this.cardModel.findByIdAndDelete(cardId).exec();
  }
}
