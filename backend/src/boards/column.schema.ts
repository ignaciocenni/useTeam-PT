import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define cómo se ve una Columna en MongoDB
@Schema({ timestamps: true })
export class Column extends Document {
  @Prop({ required: true })
  title: string; // ej: "To Do", "In Progress", "Done"

  @Prop({ required: true })
  boardId: string; // ID del tablero al que pertenece

  @Prop({ default: 0 })
  position: number; // Posición de la columna en el tablero
}

export const ColumnSchema = SchemaFactory.createForClass(Column);