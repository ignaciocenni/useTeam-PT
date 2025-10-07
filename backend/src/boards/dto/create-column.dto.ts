import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // Usamos IsNumber y IsPositive para asegurar que la posición sea un número entero positivo,
  // esencial para el orden de las columnas.
  @IsNumber()
  @IsPositive()
  position: number;
}
