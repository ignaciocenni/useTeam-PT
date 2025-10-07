import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose'; // <-- ¡Necesario!
import { Card } from './card.schema'; // <-- ¡Necesario! Ajusta la ruta

// Define cómo se ve una Columna (Column) en MongoDB
@Schema({ timestamps: true })
export class Column extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  boardId: string; // Referencia al tablero padre

  @Prop({ required: true })
  position: number;

  // 💡 FIX CRÍTICO: Definición de la relación 1:N (Array de ObjectIds referenciando 'Card')
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }] })
  cards: Card[]; // Este campo permite el populate de las tarjetas
}

export const ColumnSchema = SchemaFactory.createForClass(Column);
