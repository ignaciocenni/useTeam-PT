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
  DragEndEvent,
  DragMoveEvent,
  MouseSensor,
  TouchSensor,
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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Mover 10px para activar
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
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

    if (!over || !currentBoard) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const activeCard = activeData.card;

    // Encontrar columna de origen
    const sourceColumn = currentBoard.columns.find((col) =>
      col.cards.some((card) => card._id === activeCard._id)
    );

    if (!sourceColumn) {
      console.error("No se encontró la columna de origen");
      return;
    }

    // --- CASO 1: Mover sobre otra TARJETA ---
    if (activeData.type === "Card" && overData.type === "Card") {
      const overCard = overData.card;

      if (activeCard._id === overCard._id) {
        return; // Misma tarjeta, no hacer nada
      }

      // Encontrar columna de destino
      const targetColumn = currentBoard.columns.find((col) =>
        col.cards.some((card) => card._id === overCard._id)
      );

      if (!targetColumn) {
        console.error("No se encontró la columna de destino");
        return;
      }

      // MISMA COLUMNA - Reordenar
      if (sourceColumn._id === targetColumn._id) {
        const cardsInColumn = [...sourceColumn.cards];
        const oldIndex = cardsInColumn.findIndex(
          (c) => c._id === activeCard._id
        );
        const newIndex = cardsInColumn.findIndex((c) => c._id === overCard._id);

        const [removed] = cardsInColumn.splice(oldIndex, 1);
        cardsInColumn.splice(newIndex, 0, removed);

        const newPosition = cardsInColumn.findIndex(
          (c) => c._id === activeCard._id
        );

        console.log(
          `[DND] Moviendo "${activeCard.title}" en columna "${sourceColumn.title}" a posición ${newPosition}`
        );

        moveCard(
          activeCard._id,
          sourceColumn._id,
          sourceColumn._id,
          newPosition
        );
      }
      // COLUMNAS DIFERENTES
      else {
        const cardsInTargetColumn = [...targetColumn.cards];
        const targetIndex = cardsInTargetColumn.findIndex(
          (c) => c._id === overCard._id
        );
        const newPosition = targetIndex;

        console.log(
          `[DND] Moviendo "${activeCard.title}" de "${sourceColumn.title}" a "${targetColumn.title}" posición ${newPosition}`
        );

        moveCard(
          activeCard._id,
          sourceColumn._id,
          targetColumn._id,
          newPosition
        );
      }
    }
    // --- CASO 2: Soltar sobre una COLUMNA vacía o al final ---
    else if (activeData.type === "Card" && overData.type === "Column") {
      const targetColumn = overData.column;

      console.log(
        `[DND] Moviendo "${activeCard.title}" a columna "${targetColumn.title}" (al final)`
      );

      // Insertar al final de la columna
      const newPosition = targetColumn.cards.length;

      moveCard(activeCard._id, sourceColumn._id, targetColumn._id, newPosition);
    }
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
          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeCard ? (
              <div
                className="bg-white p-4 rounded-lg shadow-2xl border-2 border-blue-500 cursor-grabbing"
                style={{
                  width: "320px", // 👈 Mismo ancho que las tarjetas
                  opacity: 0.95,
                }}
              >
                <h3 className="font-medium text-gray-900">
                  {activeCard.title}
                </h3>
                {activeCard.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activeCard.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Posición: {activeCard.position}</span>
                  <span className="text-blue-600 font-medium">
                    📦 Moviendo...
                  </span>
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
