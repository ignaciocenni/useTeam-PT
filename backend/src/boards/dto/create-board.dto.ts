import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/* eslint-disable @typescript-eslint/no-unsafe-call */
export class CreateBoardDto {
  @IsString() // Asegura que el valor sea un string
  @IsNotEmpty() // Asegura que el valor no esté vacío (no puede ser solo espacios o null)
  title: string;

  @IsString()
  @IsOptional() // Permite que el campo no esté presente en la petición
  description?: string;
}
