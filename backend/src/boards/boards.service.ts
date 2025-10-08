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
    const board = await this.boardModel
      .findById(boardId)
      .populate({
        path: 'columns',
        populate: {
          path: 'cards',
          options: { sort: { position: 1 } },
        },
      })
      .exec();

    if (!board) {
      throw new Error('Board no encontrado');
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
    updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    // 👇 NUEVO: Log para debug
    console.log(`[BoardsService] updateCard llamado:`);
    console.log(`  - boardId: ${boardId}`);
    console.log(`  - columnId: ${columnId}`);
    console.log(`  - cardId: ${cardId}`);
    console.log(`  - updates:`, updateCardDto);

    // 1. Buscamos y actualizamos la tarjeta en la DB
    const updatedCard = await this.cardModel
      .findOneAndUpdate(
        { _id: cardId, columnId: columnId },
        {
          $set: {
            ...updateCardDto,
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedCard) {
      throw new NotFoundException(
        `Card with ID ${cardId} not found in column ${columnId}`,
      );
    }

    // 👇 NUEVO: Log después de actualizar
    console.log(`[BoardsService] Tarjeta actualizada:`, updatedCard.toObject());

    // 💡 2. EMISIÓN DEL EVENTO WEBSOCKET A ROOM ESPECÍFICO
    const payload = {
      card: updatedCard.toObject(),
      sourceColumnId: columnId,
      destinationColumnId: updatedCard.columnId.toString(),
      boardId,
      timestamp: new Date().toISOString(),
    };

    // 👇 NUEVO: Log antes de emitir
    console.log(
      `[BoardsService] Emitiendo evento 'cardMoved' con payload:`,
      payload,
    );

    // Usar el nuevo método para emitir solo al board específico
    this.boardsGateway.emitToBoard(boardId, 'cardMoved', payload);

    return updatedCard.toObject();
  }

  // Eliminar una tarjeta
  async deleteCard(cardId: string) {
    return await this.cardModel.findByIdAndDelete(cardId).exec();
  }
}
