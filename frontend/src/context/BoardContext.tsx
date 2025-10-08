// src/context/BoardContext.tsx

import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useCallback,
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

// 💡 USAR types.Card
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
    } // 💡 Nueva acción WS
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
      if (!state.currentBoard) return state;
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
      if (!state.currentBoard) return state;

      const {
        card: movedCard,
        sourceColumnId,
        destinationColumnId,
      } = action.payload;

      const newColumns = state.currentBoard.columns.map((col) => {
        // 1. Quitar la tarjeta de la columna de origen
        if (col._id === sourceColumnId) {
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== movedCard._id),
          };
        }

        // 2. Añadir/Reordenar la tarjeta en la columna de destino
        else if (col._id === destinationColumnId) {
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
  const { isConnected, lastEvent } = useSocket(boardId);

  // Sincronizar el estado de conexión del socket
  useEffect(() => {
    dispatch({ type: "WS_CONNECTION_CHANGE", payload: isConnected });
  }, [isConnected]);

  // Procesar eventos WebSocket entrantes
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.eventName === "cardCreated") {
        dispatch({
          type: "CARD_CREATED",
          payload: lastEvent.payload as types.Card,
        });
      } else if (lastEvent.eventName === "cardMoved") {
        const payload = lastEvent.payload as {
          card: types.Card;
          sourceColumnId: string;
          destinationColumnId: string;
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
