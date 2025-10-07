// src/context/BoardContext.tsx

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { Board, Column, Card, WSEventPayload } from '../types/board';
import { useSocket } from '../hooks/useSocket';
import * as api from '../services/api'; // Importamos todas las funciones CRUD

// ===================================================
// 1. TIPOS DE ESTADO Y ACCIONES
// ===================================================

interface BoardState {
  currentBoard: Board | null; // El tablero que estamos viendo actualmente
  loading: boolean;
  error: string | null;
  isConnected: boolean; // Estado de la conexión WebSocket
  // Podrías añadir una lista de todos los tableros aquí, pero por ahora nos enfocamos en uno
}

type BoardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Board }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'WS_CONNECTION_CHANGE'; payload: boolean }
  | { type: 'CARD_CREATED'; payload: Card }
  | { type: 'CARD_DELETED'; payload: { cardId: string; columnId: string } }
  // Aquí vendrán más acciones (UPDATE_CARD, COLUMN_CREATED, etc.)
  ;

interface BoardContextType extends BoardState {
  // Aquí se definen las funciones que se exportan para interactuar con el contexto
  fetchBoard: (boardId: string) => Promise<void>;
  createCard: (columnId: string, title: string, description?: string) => Promise<void>;
  // (Aquí se añadirán las funciones de CRUD para Columnas y Tarjetas)
}

// ===================================================
// 2. ESTADO INICIAL Y REDUCER
// ===================================================

const initialState: BoardState = {
  currentBoard: null,
  loading: false,
  error: null,
  isConnected: false,
};

const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      // Asume que el backend devuelve la estructura completa (Board con Columns y Cards)
      return { ...state, loading: false, currentBoard: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'WS_CONNECTION_CHANGE':
      return { ...state, isConnected: action.payload };

    // Lógica para sincronización en tiempo real (WebSocket)
    case 'CARD_CREATED': {
      if (!state.currentBoard) return state;

      const newCard = action.payload as Card;
      
      // Encontramos la columna a modificar (basada en el columnId que viene con la Card)
      const updatedColumns = state.currentBoard.columns.map(col => {
        if (col._id === newCard.columnId) {
          // Si es la columna correcta, añadimos la nueva tarjeta
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      });

      return {
        ...state,
        currentBoard: { ...state.currentBoard, columns: updatedColumns },
      };
    }
    
    // Aquí se manejará la lógica de 'CARD_DELETED', 'CARD_UPDATED', etc.
    default:
      return state;
  }
};

// ===================================================
// 3. CONTEXTO Y PROVIDER
// ===================================================

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  
  // Hardcodeamos un ID de tablero por ahora (Deberías reemplazarlo con la lógica que elija el usuario)
  // **IMPORTANTE**: Necesitas al menos un Board creado en MongoDB para que esto funcione.
  const boardId = '68e539772824cc4d0300ad88'; // <--- ID del tablero que creaste en Postman

  // Hook para la conexión WebSocket
  const { isConnected, lastEvent } = useSocket(boardId);


  // Sincronización de WebSocket: Procesar el evento entrante
  useEffect(() => {
    // 1. Manejar la conexión
    dispatch({ type: 'WS_CONNECTION_CHANGE', payload: isConnected });

    // 2. Procesar el último evento de WS
    if (lastEvent) {
        // En un proyecto más grande usaríamos un handler externo, pero aquí lo hacemos directo
        if (lastEvent.eventName === 'cardCreated') {
            dispatch({ type: 'CARD_CREATED', payload: lastEvent.payload as Card });
        }
        // Aquí se procesarán los demás eventos...
    }
  }, [isConnected, lastEvent]);

  // Función para obtener el tablero completo (Inicial o Recarga)
  const fetchBoard = useCallback(async (id: string) => {
    dispatch({ type: 'FETCH_START' });
    try {
      // El backend devuelve Board con Columns y Cards anidadas (un solo fetch)
      const boardData = await api.getBoard(id); 
      dispatch({ type: 'FETCH_SUCCESS', payload: boardData });
    } catch (e) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Error al cargar el tablero.' });
    }
  }, []);

  // Función para crear una tarjeta (Conexión al CRUD)
  const createCard = useCallback(async (columnId: string, title: string, description?: string) => {
    if (!state.currentBoard || !boardId) return;

    try {
        // Llamada a la API REST. El backend se encargará de emitir el WS.
        // No necesitamos actualizar el estado aquí, el evento WS entrante lo hará por nosotros!
        await api.createCard(boardId, columnId, title, description, 0); 
    } catch (e) {
        console.error("Error al crear la tarjeta via REST:", e);
        // Podrías añadir un dispatch para mostrar un error al usuario.
    }
  }, [state.currentBoard, boardId]);


  // Llamada inicial para cargar el tablero
  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  return (
    <BoardContext.Provider value={{
      ...state,
      fetchBoard,
      createCard,
      // Aquí se añadirán las demás funciones CRUD
    }}>
      {children}
    </BoardContext.Provider>
  );
};

// ===================================================
// 4. CUSTOM HOOK DE USO
// ===================================================

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard debe usarse dentro de un BoardProvider');
  }
  return context;
};