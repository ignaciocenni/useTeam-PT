import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import axios from 'axios';

interface ExportCardData {
  id: string;
  title: string;
  description: string;
  column: string;
  createdAt: string;
  position: number;
}

// 👇 CAMBIO CRÍTICO: Sin el prefijo 'api/v1'
@Controller('boards/:boardId/export')
export class ExportController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getExportData(@Param('boardId') boardId: string) {
    try {
      console.log('[EXPORT] Iniciando exportación de datos');

      // Obtener el board CON populate
      const board = await this.boardsService.getBoard(boardId);

      if (!board) {
        return { error: 'Board no encontrado' };
      }

      const exportData: ExportCardData[] = [];

      // Iterar sobre columnas y tarjetas
      for (const column of board.columns) {
        // 👇 CAST a 'any' porque column.cards puede ser ObjectId[] o Card[]
        const columnCards = column.cards as any[];

        if (columnCards && Array.isArray(columnCards)) {
          for (const card of columnCards) {
            // Verificar si card es un objeto poblado (tiene title) o solo un ObjectId
            if (card && typeof card === 'object' && card.title) {
              exportData.push({
                id: card._id?.toString() || '',
                title: card.title,
                description: card.description || '',
                column: column.title,
                createdAt: card.createdAt || new Date().toISOString(),
                position: card.position || 0,
              });
            } else {
              console.warn('[EXPORT] ⚠️ Card no está poblada:', card);
            }
          }
        }
      }

      console.log(
        '[EXPORT] ✅ Datos exportados:',
        exportData.length,
        'tarjetas',
      );

      return {
        boardId: board._id?.toString() || '',
        boardTitle: board.title,
        totalCards: exportData.length,
        data: exportData,
        exportedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[EXPORT] ❌ Error al obtener datos:', error.message);
      return {
        error: 'Error al procesar la exportación',
        details: error.message,
      };
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async triggerExport(
    @Param('boardId') boardId: string,
    @Body() body: { email: string; n8nWebhookUrl?: string },
  ) {
    try {
      console.log('[EXPORT] Iniciando exportación para board:', boardId);
      console.log('[EXPORT] Email destino:', body.email);

      const exportData = await this.getExportData(boardId);

      if ('error' in exportData) {
        return {
          success: false,
          message: exportData.error,
        };
      }

      const webhookUrl =
        body.n8nWebhookUrl ||
        process.env.N8N_WEBHOOK_URL ||
        'http://localhost:5678/webhook/kanban-export';

      console.log('[EXPORT] Disparando webhook N8N:', webhookUrl);

      const response = await axios.post(
        webhookUrl,
        {
          email: body.email,
          boardData: exportData,
        },
        {
          timeout: 10000,
        },
      );

      console.log('[EXPORT] ✅ Respuesta de N8N:', response.status);

      return {
        success: true,
        message: 'Exportación iniciada correctamente',
        email: body.email,
        cardsExported: exportData.totalCards,
      };
    } catch (error: any) {
      console.error('[EXPORT] ❌ Error al disparar webhook:', error.message);

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message:
            'N8N no está disponible. Asegúrate de que esté corriendo en el puerto 5678',
          error: error.message,
        };
      }

      return {
        success: false,
        message: 'Error al iniciar la exportación',
        error: error.message,
      };
    }
  }
}
