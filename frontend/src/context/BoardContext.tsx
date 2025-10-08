// src/context/BoardContext.tsx

import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useCallback,
  useRef,
  Dispatch, // Asegúrate de que Dispatch esté aquí si usas useReducer
} from "react";

// 💡 FIX CRÍTICO: Importación Wildcard para evitar el error de ESBuild
import * as types from "../types/board";

import { useSocket } from "../hooks/useSocket";
import * as api from "../services/api";

// ===================================================
// 1. TIPOS DE ESTADO Y ACCIONES
// ===================================================

interface BoardState {
  // 💡 USAR types.Board
  currentBoard: types.Board | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

type BoardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: types.Board }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "WS_CONNECTION_CHANGE"; payload: boolean }
  | { type: "CARD_CREATED"; payload: types.Card }
  | {
      type: "WS_CARD_MOVED";
      payload: {
        card: types.Card;
        sourceColumnId: string;
        destinationColumnId: string;
      };
    }
  // 👇 NUEVO ACTION PARA UPDATE OPTIMISTA
  | {
      type: "OPTIMISTIC_CARD_MOVE";
      payload: {
        cardId: string;
        sourceColumnId: string;
        destinationColumnId: string;
        newPosition: number;
      };
    }
  | { type: "CARD_DELETED"; payload: { cardId: string; columnId: string } };

interface BoardContextType extends BoardState {
  fetchBoard: (boardId: string) => Promise<void>;
  createCard: (
    columnId: string,
    title: string,
    description?: string
  ) => Promise<void>;
  // Firma actualizada
  moveCard: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newPosition: number
  ) => Promise<void>;
  dispatch: Dispatch<BoardAction>;
}

// ===================================================
// 2. CONTEXTO, ESTADO INICIAL Y REDUCER
// ===================================================

const initialState: BoardState = {
  currentBoard: null,
  loading: false,
  error: null,
  isConnected: false,
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

// ===================================================
// 3. REDUCER
// ===================================================

const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, currentBoard: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "WS_CONNECTION_CHANGE":
      return { ...state, isConnected: action.payload };

    // ================== EVENTOS CRUD/WS ==================

    case "CARD_CREATED": {
      if (!state.currentBoard) {
        return state;
      }
      const newCard = action.payload;

      const newColumns = state.currentBoard.columns.map((col) => {
        if (col._id === newCard.columnId) {
          // CLAVE: Asegurarse de que la nueva tarjeta se agregue a la posición correcta
          const updatedCards = [...col.cards, newCard].sort(
            (a, b) => a.position - b.position
          );
          return { ...col, cards: updatedCards };
        }
        return col;
      });

      return {
        ...state,
        currentBoard: { ...state.currentBoard, columns: newColumns },
      };
    }

    // 💡 LÓGICA PARA MOVER LA TARJETA POR EVENTO WS
    case "WS_CARD_MOVED": {
      if (!state.currentBoard) {
        return state;
      }

      const {
        card: movedCard,
        sourceColumnId,
        destinationColumnId,
      } = action.payload;

      const newColumns = state.currentBoard.columns.map((col) => {
        // 1. Quitar la tarjeta de la columna de origen (si es diferente a la de destino)
        if (
          col._id === sourceColumnId &&
          sourceColumnId !== destinationColumnId
        ) {
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== movedCard._id),
          };
        }

        // 2. Añadir/Reordenar la tarjeta en la columna de destino
        if (col._id === destinationColumnId) {
          const cards = col.cards.filter((c) => c._id !== movedCard._id); // Evitar duplicados

          // Insertar la tarjeta movida en su posición correcta (basada en movedCard.position)
          cards.splice(movedCard.position, 0, movedCard);

          return { ...col, cards };
        }

        return col;
      });

      return {
        ...state,
        currentBoard: { ...state.currentBoard, columns: newColumns },
      };
    }

    // 💡 UPDATE OPTIMISTA (se ejecuta ANTES de que llegue el WS)
    case "OPTIMISTIC_CARD_MOVE": {
      if (!state.currentBoard) return state;

      const { cardId, sourceColumnId, destinationColumnId, newPosition } =
        action.payload;

      console.log(
        "[REDUCER] OPTIMISTIC_CARD_MOVE:",
        `Moviendo card ${cardId} de columna ${sourceColumnId} a ${destinationColumnId} posición ${newPosition}`
      );

      // Buscar la tarjeta en la columna de origen
      let movedCard: types.Card | null = null;

      const newColumns = state.currentBoard.columns.map((col) => {
        // 1. Remover de la columna de origen
        if (col._id === sourceColumnId) {
          const cardToMove = col.cards.find((c) => c._id === cardId);
          if (cardToMove) {
            movedCard = {
              ...cardToMove,
              columnId: destinationColumnId,
              position: newPosition,
            };
          }
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== cardId),
          };
        }
        return col;
      });

      // 2. Agregar a la columna de destino en la posición correcta
      if (movedCard) {
        const updatedColumns = newColumns.map((col) => {
          if (col._id === destinationColumnId) {
            const newCards = [...col.cards];
            newCards.splice(newPosition, 0, movedCard!);

            // Reordenar posiciones
            const reorderedCards = newCards.map((card, index) => ({
              ...card,
              position: index,
            }));

            return { ...col, cards: reorderedCards };
          }
          return col;
        });

        return {
          ...state,
          currentBoard: { ...state.currentBoard, columns: updatedColumns },
        };
      }

      return state;
    }

    case "CARD_DELETED":
      // ... (Tu lógica para eliminar tarjeta)
      return state;

    default:
      return state;
  }
};

// ===================================================
// 4. PROVIDER
// ===================================================

interface BoardProviderProps {
  children: React.ReactNode;
  boardId?: string; // Opcional si lo pasas desde un router
}

export const BoardProvider: React.FC<BoardProviderProps> = ({
  children,
  boardId = "68e539772824cc4d0300ad88",
}) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { isConnected, lastEvent, boardUsers } = useSocket(boardId);

  // Ref para rastrear eventos ya procesados (no causa re-renders)
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Sincronizar el estado de conexión del socket
  useEffect(() => {
    dispatch({ type: "WS_CONNECTION_CHANGE", payload: isConnected });
  }, [isConnected]);

  // Procesar eventos WebSocket entrantes
  useEffect(() => {
    if (lastEvent) {
      // Crear una clave única para el evento
      const eventKey = `${lastEvent.eventName}-${
        lastEvent.payload?.card?._id || lastEvent.payload?.cardId || "unknown"
      }-${lastEvent.payload?.timestamp || Date.now()}`;

      // Verificar si ya procesamos este evento
      if (processedEventsRef.current.has(eventKey)) {
        return;
      }

      console.log("[BoardContext] Processing event:", lastEvent.eventName);

      // Marcar el evento como procesado
      processedEventsRef.current.add(eventKey);

      if (lastEvent.eventName === "cardCreated") {
        // El payload del backend tiene la estructura: { card: Card, boardId: string, timestamp: string }
        const cardData = lastEvent.payload.card || lastEvent.payload;
        dispatch({
          type: "CARD_CREATED",
          payload: cardData as types.Card,
        });
      } else if (lastEvent.eventName === "cardMoved") {
        const payload = lastEvent.payload as {
          card: types.Card;
          sourceColumnId: string;
          destinationColumnId: string;
          boardId: string;
          timestamp: string;
        };
        dispatch({ type: "WS_CARD_MOVED", payload });
      }
      // Aquí se procesarán los demás eventos...
    }
  }, [lastEvent]);

  const fetchBoard = useCallback(async (id: string) => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await api.getBoard(id);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (e) {
      dispatch({ type: "FETCH_ERROR", payload: "Error al cargar el tablero." });
    }
  }, []);

  // Función para crear una tarjeta (Conexión al CRUD)
  const createCard = useCallback(
    async (columnId: string, title: string, description?: string) => {
      if (!state.currentBoard || !boardId) return;

      try {
        // Llamada a la API REST. El backend se encargará de emitir el WS.
        await api.createCard(boardId, columnId, title, description, 0);
      } catch (e) {
        console.error("Error al crear la tarjeta via REST:", e);
      }
    },
    [state.currentBoard, boardId]
  );

  // Función para mover una tarjeta (Lógica de dnd-kit y API)
  const moveCard = useCallback(
    async (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      newPosition: number
    ) => {
      if (!state.currentBoard || !boardId) return;

      console.log(
        `[API] Persistiendo movimiento de tarjeta ${cardId} a columna ${destinationColumnId} posición ${newPosition}`
      );

      try {
        const updates = {
          position: newPosition,
          columnId: destinationColumnId,
        };

        // 👇 AGREGÁ ESTE LOG ANTES DE LA LLAMADA
        console.log(
          `[API] URL completa: /boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}`
        );
        console.log("[API] Payload:", updates);

        // Llamada a la API REST para persistir
        await api.updateCard(boardId, sourceColumnId, cardId, updates);

        console.log("[API] Movimiento persistido exitosamente");
      } catch (e) {
        // 👇 MODIFICÁ ESTE CATCH PARA VER EL ERROR COMPLETO
        console.error("❌ [API] Error al mover la tarjeta:", e);
        console.error(
          "❌ [API] Detalles del error:",
          e.response?.data || e.message
        );
      }
    },
    [state.currentBoard, boardId]
  );

  // Llamada inicial para cargar el tablero
  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  return (
    <BoardContext.Provider
      value={{
        ...state,
        fetchBoard,
        createCard,
        moveCard, // Añadimos la función de movimiento
        dispatch, // Añadimos dispatch
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

// ===================================================
// 5. CUSTOM HOOK DE USO
// ===================================================

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
};
