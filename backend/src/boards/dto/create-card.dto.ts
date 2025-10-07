import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
} from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  title: string; // Título de la tarjeta (obligatorio)

  @IsString()
  @IsOptional()
  description?: string; // Descripción (opcional)

  // La posición debe ser un número entero (opcional, el service le dará un valor por defecto si no se envía)
  @IsNumber()
  @IsInt()
  @IsOptional()
  position?: number;
}
