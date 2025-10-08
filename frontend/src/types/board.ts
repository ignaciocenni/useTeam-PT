export interface Card {
  _id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  // Añade aquí cualquier otro campo que tu backend devuelva para Card
}

export interface Column {
  _id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[]; // Array de tarjetas
  // Añade aquí cualquier otro campo que tu backend devuelva para Column
}

export interface Board {
  _id: string;
  title: string;
  description: string;
  columns: Column[]; // Array de columnas
  // Añade aquí cualquier otro campo que tu backend devuelva para Board
}

export interface WSEventPayload {
  eventName: string;
  payload: any; // El contenido del evento (puede ser Card, Column, etc.)
}
