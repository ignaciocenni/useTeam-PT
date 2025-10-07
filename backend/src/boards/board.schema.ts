import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Column } from '../boards/column.schema';

// Define cómo se ve un Tablero (Board) en MongoDB
@Schema({ timestamps: true })
export class Board extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  // FIX CRÍTICO: Definición de la relación 1:N con Columnas
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }] })
  columns: Column[];
}

export const BoardSchema = SchemaFactory.createForClass(Board);
