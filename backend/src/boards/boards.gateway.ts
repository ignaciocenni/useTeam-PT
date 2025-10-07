// backend/src/boards/boards.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
  // ----------------------------------------------------
  // MÉTODOS DE CICLO DE VIDA (Para rastrear clientes)
  // ----------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket) {
    // ... lógica de conexión
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDisconnect(client: Socket) {
    // ... lógica de desconexión
  }

  emitBoardUpdate(eventName: string, payload: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.server.emit('boardUpdated', { eventName, payload });
  }
}
