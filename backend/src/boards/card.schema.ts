import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define cómo se ve una Tarjeta (Card) en MongoDB
@Schema({ timestamps: true }) // timestamps: true → Agrega createdAt y updatedAt automáticamente
export class Card extends Document {
  @Prop({ required: true }) // Campo obligatorio
  title: string;

  @Prop() // Campo opcional
  description: string;

  @Prop({ required: true })
  columnId: string; // ID de la columna a la que pertenece

  @Prop({ default: 0 }) // Valor por defecto: 0
  position: number; // Posición dentro de la columna (para ordenar)
}

// Exporta el Schema para usarlo en el módulo
export const CardSchema = SchemaFactory.createForClass(Card);