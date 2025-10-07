import { PartialType } from '@nestjs/mapped-types';
import { CreateColumnDto } from './create-column.dto';

// Hace que 'title' y 'position' sean opcionales
export class UpdateColumnDto extends PartialType(CreateColumnDto) {}
