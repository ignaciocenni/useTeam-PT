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
      const board = await this.boardsService.getBoard(boardId);

      if (!board) {
        return { error: 'Board no encontrado' };
      }

      const exportData: ExportCardData[] = [];

      for (const column of board.columns) {
        for (const card of column.cards) {
          exportData.push({
            id: card._id?.toString() || '',
            title: card.title,
            description: card.description || '',
            column: column.title,
            createdAt: (card as any).createdAt || new Date().toISOString(),
            position: card.position,
          });
        }
      }

      return {
        boardId: board._id?.toString() || '',
        boardTitle: board.title,
        totalCards: exportData.length,
        data: exportData,
        exportedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[EXPORT] Error al obtener datos:', error.message);
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
