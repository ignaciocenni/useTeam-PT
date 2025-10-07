import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define cómo se ve un Tablero (Board) en MongoDB
@Schema({ timestamps: true })
export class Board extends Document {
  @Prop({ required: true })
  title: string; // ej: "Proyecto E-commerce"

  @Prop()
  description: string; // Descripción opcional del tablero
}

export const BoardSchema = SchemaFactory.createForClass(Board);