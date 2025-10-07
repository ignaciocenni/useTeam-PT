import { CreateBoardDto } from './dto/create-board.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board } from './board.schema';
import { Column } from './column.schema';
import { Card } from './card.schema';

@Injectable()
export class BoardsService {
  constructor(
    // Inyectamos los 3 Models que creó Mongoose
    @InjectModel(Board.name) private boardModel: Model<Board>,
    @InjectModel(Column.name) private columnModel: Model<Column>,
    @InjectModel(Card.name) private cardModel: Model<Card>,
  ) {}

  // ==================== BOARDS ====================

  // Crear un nuevo tablero
  // REFACTORIZADO para recibir el DTO completo, siguiendo la convención de NestJS
  async createBoard(createBoardDto: CreateBoardDto) {
    const newBoard = new this.boardModel(createBoardDto); // Pasamos el objeto directamente
    return await newBoard.save();
  }

  // Obtener todos los tableros
  async getAllBoards() {
    return await this.boardModel.find().exec(); // .find() sin parámetros = todos los documentos
  }

  // Obtener un tablero por ID
  async getBoardById(boardId: string) {
    return await this.boardModel.findById(boardId).exec();
  }

  // Eliminar un tablero
  async deleteBoard(boardId: string) {
    return await this.boardModel.findByIdAndDelete(boardId).exec();
  }

  // ==================== COLUMNS ====================

  // Crear una columna en un tablero
  async createColumn(boardId: string, title: string, position: number) {
    const newColumn = new this.columnModel({
      boardId,
      title,
      position,
    });
    return await newColumn.save();
  }

  // Obtener todas las columnas de un tablero
  async getColumnsByBoard(boardId: string) {
    return await this.columnModel
      .find({ boardId })
      .sort({ position: 1 })
      .exec();
    // .sort({ position: 1 }) = ordenar por posición ascendente
  }

  // Eliminar una columna
  async deleteColumn(columnId: string) {
    return await this.columnModel.findByIdAndDelete(columnId).exec();
  }

  // ==================== CARDS ====================

  // Crear una tarjeta en una columna
  async createCard(
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
    return await newCard.save();
  }

  // Obtener todas las tarjetas de una columna
  async getCardsByColumn(columnId: string) {
    return await this.cardModel.find({ columnId }).sort({ position: 1 }).exec();
  }

  // Actualizar una tarjeta (moverla de columna o cambiar posición)
  async updateCard(cardId: string, updates: Partial<Card>) {
    return await this.cardModel
      .findByIdAndUpdate(
        cardId,
        updates,
        { new: true }, // { new: true } = devuelve el documento actualizado (no el viejo)
      )
      .exec();
  }

  // Eliminar una tarjeta
  async deleteCard(cardId: string) {
    return await this.cardModel.findByIdAndDelete(cardId).exec();
  }
}
