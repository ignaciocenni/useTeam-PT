import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose'; // <-- ¡Necesario!
import { Card } from './card.schema'; // <-- ¡Necesario! Ajusta la ruta

// Define cómo se ve una Columna (Column) en MongoDB
@Schema({ timestamps: true })
export class Column extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true })
  boardId: mongoose.Types.ObjectId;

  @Prop({ default: 0 })
  position: number;

  // 👇 CRÍTICO: La referencia a las cards
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }] })
  cards: mongoose.Types.ObjectId[];
}

export const ColumnSchema = SchemaFactory.createForClass(Column);
