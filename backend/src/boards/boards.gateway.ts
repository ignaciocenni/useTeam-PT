import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa para rastrear qué usuario está en qué board
  private userBoards = new Map<string, string>();

  // ----------------------------------------------------
  // MÉTODOS DE CICLO DE VIDA
  // ----------------------------------------------------

  handleConnection(client: Socket) {
    console.log(`[WS] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Cliente desconectado: ${client.id}`);
    
    // Limpiar el mapa de usuarios
    if (this.userBoards.has(client.id)) {
      this.userBoards.delete(client.id);
    }
  }

  // ----------------------------------------------------
  // MÉTODOS DE ROOMS
  // ----------------------------------------------------

  /**
   * Unirse a un room específico de board
   */
  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    const { boardId } = data;
    
    // Salir del board anterior si existe
    if (this.userBoards.has(client.id)) {
      const previousBoardId = this.userBoards.get(client.id);
      client.leave(`board-${previousBoardId}`);
    }

    // Unirse al nuevo board
    client.join(`board-${boardId}`);
    this.userBoards.set(client.id, boardId);
    
    console.log(`[WS] Cliente ${client.id} se unió al board ${boardId}`);
    
    // Notificar a otros usuarios del board
    client.to(`board-${boardId}`).emit('userJoined', {
      userId: client.id,
      boardId,
      timestamp: new Date().toISOString()
    });

    return { success: true, boardId };
  }

  /**
   * Salir de un board
   */
  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    const { boardId } = data;
    
    client.leave(`board-${boardId}`);
    this.userBoards.delete(client.id);
    
    console.log(`[WS] Cliente ${client.id} salió del board ${boardId}`);
    
    // Notificar a otros usuarios del board
    client.to(`board-${boardId}`).emit('userLeft', {
      userId: client.id,
      boardId,
      timestamp: new Date().toISOString()
    });

    return { success: true, boardId };
  }

  // ----------------------------------------------------
  // MÉTODOS DE EMISIÓN ESPECÍFICOS
  // ----------------------------------------------------

  /**
   * Emitir evento a un board específico
   */
  emitToBoard(boardId: string, eventName: string, payload: any) {
    console.log(`[WS] Emitiendo ${eventName} al board ${boardId}:`, payload);
    this.server.to(`board-${boardId}`).emit(eventName, payload);
  }

  /**
   * Emitir evento a todos los clientes
   */
  emitToAll(eventName: string, payload: any) {
    console.log(`[WS] Emitiendo ${eventName} a todos:`, payload);
    this.server.emit(eventName, payload);
  }

  /**
   * Obtener usuarios conectados a un board
   */
  getBoardUsers(boardId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(`board-${boardId}`);
    return room ? Array.from(room) : [];
  }

  /**
   * Obtener estadísticas de conexión
   */
  getConnectionStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      userBoards: Object.fromEntries(this.userBoards),
      rooms: Array.from(this.server.sockets.adapter.rooms.keys())
    };
  }

  // Método legacy para compatibilidad
  emitBoardUpdate(eventName: string, payload: any) {
    console.log(`[BoardsGateway] Emitiendo evento: ${eventName}`, payload);
    this.server.emit(eventName, payload);
  }
}
