import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post() // Maneja las peticiones POST a /boards
  async create(@Body() createBoardDto: CreateBoardDto) {
    // Código limpio: pasamos el DTO de una vez al service
    return this.boardsService.createBoard(createBoardDto);
  }

  /**
   * Ruta: GET /api/v1/boards
   * Obtiene todos los tableros.
   */
  @Get()
  async findAll() {
    // Llama al service para encontrar todos los documentos.
    return this.boardsService.getAllBoards();
  }

  /**
   * Ruta: GET /api/v1/boards/:id
   * @Param('id') extrae el valor del segmento ':id' de la URL.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Llama al service para buscar por ID.
    return this.boardsService.getBoardById(id);
  }

  /**
   * Ruta: PATCH /api/v1/boards/:id
   * Actualiza parcialmente un tablero.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, // El ID extraído de la URL
    @Body() updateBoardDto: UpdateBoardDto, // Los campos opcionales a actualizar
  ) {
    return this.boardsService.updateBoard(id, updateBoardDto);
  }

  /**
   * Ruta: DELETE /api/v1/boards/:id
   * Elimina un tablero.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    // findByIdAndDelete por defecto devuelve el objeto eliminado.
    await this.boardsService.deleteBoard(id);
    // Devolvemos un objeto de confirmación claro para el frontend.
    return { status: 200, message: 'Tablero eliminado con éxito.' };
  }
}
