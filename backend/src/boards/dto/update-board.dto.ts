import { PartialType } from '@nestjs/mapped-types';
import { CreateBoardDto } from './create-board.dto';

// Usamos PartialType para crear una clase que hereda las propiedades de CreateBoardDto,
// pero las hace a todas opcionales (title?: string, description?: string).
export class UpdateBoardDto extends PartialType(CreateBoardDto) {}
