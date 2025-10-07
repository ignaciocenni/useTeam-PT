import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';

// Hace que 'title', 'description' y 'position' sean opcionales.
export class UpdateCardDto extends PartialType(CreateCardDto) {}
