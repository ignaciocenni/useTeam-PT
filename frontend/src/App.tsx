import React, { useEffect, useState } from "react";
import { useBoard, BoardProvider } from "./context/BoardContext";
import { Card } from "./types/board";
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { ColumnContainer } from "./components/ColumnContainer";
import { ExportModal } from "./components/ExportModal";
import * as api from "./services/api";

// ----------------------------------------------------
// Componente principal de visualización del tablero
// ----------------------------------------------------
function BoardPageContent() {
  // 💡 Extraemos moveCard del contexto para usarlo en handleDragEnd
  const {
    currentBoard,
    loading,
    error,
    isConnected,
    createCard,
    moveCard,
    dispatch,
  } = useBoard();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // 👇 NUEVO: Log temporal para debug
  useEffect(() => {
    console.log("[APP] currentBoard cambió:", currentBoard);
  }, [currentBoard]);

  const handleCreateTestCard = () => {
    if (
      !currentBoard ||
      !currentBoard.columns ||
      currentBoard.columns.length === 0
    )
      return;

    // Usamos el ID de la primera columna para la prueba
    const firstColumnId = currentBoard.columns[0]._id;
    if (firstColumnId) {
      createCard(
        firstColumnId,
        `Nueva Tarea - ${new Date().toLocaleTimeString()}`,
        "Descripción de prueba"
      );
    }
  };

  const handleExport = async (email: string) => {
    if (!currentBoard) return;

    try {
      const result = await api.exportBacklog(currentBoard._id, email);
      console.log("[EXPORT] Resultado:", result);

      if (!result.success) {
        throw new Error(result.message || "Error al exportar");
      }
    } catch (error: any) {
      console.error("[EXPORT] Error:", error);
      throw error;
    }
  };

  // Definimos el sensor de puntero con un pequeño retraso
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // La persona debe mover el puntero al menos 8px para considerarlo arrastre
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "Card") {
      setActiveCard(activeData.card);
    }
  };

  // Función que se llama cuando se suelta un elemento
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveCard(null);

    // Si no hay tablero o no soltó sobre una zona válida, salimos
    if (!over || !currentBoard) return;

    const activeData = active.data.current; // Tarjeta que se arrastró
    const overData = over.data.current; // Tarjeta o columna sobre la que se soltó

    // Extraemos la tarjeta que se está moviendo
    const activeCard = activeData.card;

    // Encontramos en qué columna está la tarjeta activa
    const sourceColumn = currentBoard.columns.find((col) =>
      col.cards.some((card) => card._id === activeCard._id)
    );

    if (!sourceColumn) {
      console.error("No se encontró la columna de origen");
      return;
    }

    // --- CASO 1: Mover DENTRO de la misma columna ---
    if (activeData.type === "Card" && overData.type === "Card") {
      const overCard = overData.card;

      // Verificamos si la tarjeta se movió a una posición diferente
      if (activeCard._id === overCard._id) {
        // Es la misma tarjeta, no hacer nada
        return;
      }

      // Encontramos en qué columna está la tarjeta objetivo
      const targetColumn = currentBoard.columns.find((col) =>
        col.cards.some((card) => card._id === overCard._id)
      );

      if (!targetColumn) {
        console.error("No se encontró la columna de destino");
        return;
      }

      // --- CASO 1A: MISMA COLUMNA ---
      if (sourceColumn._id === targetColumn._id) {
        const cardsInColumn = [...sourceColumn.cards];
        const oldIndex = cardsInColumn.findIndex(
          (c) => c._id === activeCard._id
        );
        const newIndex = cardsInColumn.findIndex((c) => c._id === overCard._id);

        // Reordenar localmente (array-move manual)
        const [removed] = cardsInColumn.splice(oldIndex, 1);
        cardsInColumn.splice(newIndex, 0, removed);

        // Calcular la nueva posición (el índice en el array)
        const newPosition = cardsInColumn.findIndex(
          (c) => c._id === activeCard._id
        );

        console.log(
          `[DND] Moviendo tarjeta "${activeCard.title}" dentro de la columna "${sourceColumn.title}" a posición ${newPosition}`
        );

        // Llamar a la API para persistir
        moveCard(
          activeCard._id,
          sourceColumn._id, // Columna de origen
          sourceColumn._id, // Columna de destino (es la misma)
          newPosition
        );
      }
      // --- CASO 1B: COLUMNAS DIFERENTES ---
      else {
        // Calcular la nueva posición en la columna de destino
        const cardsInTargetColumn = [...targetColumn.cards];
        const targetIndex = cardsInTargetColumn.findIndex(
          (c) => c._id === overCard._id
        );

        // La tarjeta se insertará ANTES de la tarjeta sobre la que se soltó
        const newPosition = targetIndex;

        console.log(
          `[DND] Moviendo tarjeta "${activeCard.title}" de columna "${sourceColumn.title}" a "${targetColumn.title}" en posición ${newPosition}`
        );

        // Llamar a la API para persistir
        moveCard(
          activeCard._id,
          sourceColumn._id, // Columna de origen
          targetColumn._id, // Columna de destino (diferente)
          newPosition
        );
      }
    }

    // --- CASO 2: Soltar sobre una COLUMNA vacía o al final ---
    // (Esto pasa cuando soltás sobre el fondo de la columna, no sobre una tarjeta)
    // Por ahora, no implementamos esto para simplificar
    // Pero si querés, podemos agregarlo después
  };

  // --- Renderizado de Estado ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-700">
            Cargando Tablero...
          </h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-700 mb-2">Error</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h1 className="text-xl font-semibold text-gray-600">
            No se encontró el tablero
          </h1>
        </div>
      </div>
    );
  }

  // --- Renderizado del Tablero ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentBoard.title}
              </h1>
              {currentBoard.description && (
                <p className="ml-4 text-gray-600 text-sm">
                  {currentBoard.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>

              {/* 👇 NUEVO: Botón de Exportar */}
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Exportar Backlog</span>
              </button>

              <button
                onClick={handleCreateTestCard}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg ${
                  !currentBoard.columns?.length &&
                  "opacity-50 cursor-not-allowed"
                }`}
                disabled={!currentBoard.columns?.length}
              >
                + Nueva Tarea
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {(currentBoard.columns || []).map((column) => (
              <ColumnContainer key={column._id} column={column} />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="bg-blue-50 p-4 rounded-lg shadow-2xl border-2 border-blue-500 transform rotate-1 scale-110">
                <h3 className="font-medium text-blue-900">
                  {activeCard.title}
                </h3>
                {activeCard.description && (
                  <p className="text-sm text-blue-700 mt-1">
                    {activeCard.description}
                  </p>
                )}
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  Arrastrando...
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
      {/* 👇 NUEVO: Modal de Exportación */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        boardTitle={currentBoard?.title || "Tablero"}
      />
    </div>
  );
}

// ----------------------------------------------------
// Componente principal que provee el contexto
// ----------------------------------------------------
export default function App() {
  return (
    // Envolvemos toda la aplicación con el BoardProvider
    <BoardProvider>
      <BoardPageContent />
    </BoardProvider>
  );
}
