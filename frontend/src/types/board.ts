export interface Card {
  _id: string;
  title: string;
  description?: string;
  position: number;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  title: string;
  position: number;
  cards: Card[]; // Array de tarjetas dentro de esta columna
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  columns: Column[]; // Array de columnas dentro de este tablero
  createdAt: string;
  updatedAt: string;
}

// Tipos para el Payload del WebSocket
export interface WSEventPayload {
  eventName:
    | "cardCreated"
    | "cardUpdated"
    | "cardDeleted"
    | "columnCreated"
    | "columnDeleted";
  payload: Card | Column; // El objeto de datos que se modificó
}
