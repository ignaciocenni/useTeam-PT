// src/context/BoardContext.tsx

import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useCallback,
  useRef,
  Dispatch,
} from "react";

import * as types from "../types/board";
import { useSocket } from "../hooks/useSocket";
import * as api from "../services/api";

// ===================================================
// 1. TIPOS DE ESTADO Y ACCIONES
// ===================================================

interface BoardState {
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

    case "CARD_CREATED": {
      if (!state.currentBoard) {
        return state;
      }
      const newCard = action.payload;

      const newColumns = state.currentBoard.columns.map((col) => {
        if (col._id === newCard.columnId) {
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
        if (
          col._id === sourceColumnId &&
          sourceColumnId !== destinationColumnId
        ) {
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== movedCard._id),
          };
        }

        if (col._id === destinationColumnId) {
          const cards = col.cards.filter((c) => c._id !== movedCard._id);
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

      let movedCard: types.Card | null = null;

      const newColumns = state.currentBoard.columns.map((col) => {
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

      if (movedCard) {
        const updatedColumns = newColumns.map((col) => {
          if (col._id === destinationColumnId) {
            const newCards = [...col.cards];
            newCards.splice(newPosition, 0, movedCard!);

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
  boardId?: string;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({
  children,
  boardId = "68e539772824cc4d0300ad88",
}) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { isConnected, lastEvent } = useSocket(boardId);

  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    dispatch({ type: "WS_CONNECTION_CHANGE", payload: isConnected });
  }, [isConnected]);

  // Procesar eventos WebSocket entrantes
  useEffect(() => {
    if (lastEvent) {
      const eventKey = `${lastEvent.eventName}-${
        lastEvent.payload?.card?._id || lastEvent.payload?.cardId || "unknown"
      }-${lastEvent.payload?.timestamp || Date.now()}`;

      if (processedEventsRef.current.has(eventKey)) {
        console.log("[BoardContext] Evento ya procesado, ignorando");
        return;
      }

      console.log("[BoardContext] Processing event:", lastEvent.eventName);
      processedEventsRef.current.add(eventKey);

      if (lastEvent.eventName === "cardCreated") {
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

        // 👇 NUEVO: Verificar si ya aplicamos el cambio optimista
        const currentColumn = state.currentBoard?.columns.find(
          (col) => col._id === payload.destinationColumnId
        );
        const cardInPosition = currentColumn?.cards.find(
          (c) =>
            c._id === payload.card._id && c.position === payload.card.position
        );

        if (cardInPosition) {
          console.log(
            "[BoardContext] Evento WS coincide con estado optimista, ignorando"
          );
          return;
        }

        dispatch({ type: "WS_CARD_MOVED", payload });
      }
    }
  }, [lastEvent, state.currentBoard]);

  const fetchBoard = useCallback(async (id: string) => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await api.getBoard(id);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (e) {
      dispatch({ type: "FETCH_ERROR", payload: "Error al cargar el tablero." });
    }
  }, []);

  const createCard = useCallback(
    async (columnId: string, title: string, description?: string) => {
      if (!state.currentBoard || !boardId) return;

      try {
        await api.createCard(boardId, columnId, title, description, 0);
      } catch (e) {
        console.error("Error al crear la tarjeta via REST:", e);
      }
    },
    [state.currentBoard, boardId]
  );

  const moveCard = useCallback(
    async (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      newPosition: number
    ) => {
      if (!state.currentBoard || !boardId) return;

      console.log("[moveCard] =====================================");
      console.log(`[moveCard] cardId: ${cardId}`);
      console.log(`[moveCard] sourceColumnId: ${sourceColumnId}`);
      console.log(`[moveCard] destinationColumnId: ${destinationColumnId}`);
      console.log(`[moveCard] newPosition: ${newPosition}`);

      // UPDATE OPTIMISTA
      dispatch({
        type: "OPTIMISTIC_CARD_MOVE",
        payload: {
          cardId,
          sourceColumnId,
          destinationColumnId,
          newPosition,
        },
      });

      try {
        const updates = {
          position: newPosition,
          columnId: destinationColumnId, // 👈 IMPORTANTE
        };

        console.log("[moveCard] Updates que se enviarán:", updates);
        console.log(
          "[moveCard] URL:",
          `/api/v1/boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}`
        );

        await api.updateCard(boardId, sourceColumnId, cardId, updates);

        console.log("[moveCard] ✅ Movimiento persistido exitosamente");
      } catch (e: any) {
        console.error("❌ [moveCard] Error:", e);
        console.error("❌ [moveCard] Response:", e.response?.data);
      }
    },
    [state.currentBoard, boardId, dispatch]
  );

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
        moveCard,
        dispatch,
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
