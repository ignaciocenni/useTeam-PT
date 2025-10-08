import { useBoard, BoardProvider } from "./context/BoardContext";
import { Card } from "./types/board";
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
} from "@dnd-kit/core";
import { ColumnContainer } from "./components/ColumnContainer";
import { useEffect } from "react";

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
        `Nueva Tarea de Prueba - ${new Date().toLocaleTimeString()}`,
        "Descripción de prueba"
      );
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

  // Función que se llama cuando se suelta un elemento
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

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
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Cargando Tablero...</h1>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 text-center">Error: {error}</div>;
  }

  if (!currentBoard) {
    return (
      <div className="p-4 text-gray-600 text-center">
        No se seleccionó o encontró el tablero.
      </div>
    );
  }

  // --- Renderizado del Tablero ---
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">{currentBoard.title}</h1>
        {isConnected ? (
          <span className="bg-green-500 text-xs font-semibold px-2 py-1 rounded-full">
            WS Conectado
          </span>
        ) : (
          <span className="bg-red-500 text-xs font-semibold px-2 py-1 rounded-full">
            WS Desconectado
          </span>
        )}
      </header>

      <main className="container mx-auto p-4">
        {/* Botón de prueba de Creación de Tarjeta */}
        <button
          onClick={handleCreateTestCard}
          className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-150 mb-4 ${
            !currentBoard.columns?.length && "opacity-50 cursor-not-allowed"
          }`}
          disabled={!currentBoard.columns?.length}
        >
          + Crear Tarjeta (Prueba WS)
        </button>

        {/* Botón de prueba de Creación de Columna */}
        <button
          onClick={async () => {
            if (!currentBoard) return;
            try {
              await fetch(
                `http://localhost:3000/api/v1/boards/${currentBoard._id}/columns`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `Columna ${currentBoard.columns.length + 1}`,
                    position: currentBoard.columns.length,
                  }),
                }
              );
              // Recargar el tablero para ver la nueva columna
              window.location.reload();
            } catch (e) {
              console.error("Error al crear columna:", e);
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 mb-4 ml-2"
        >
          + Crear Columna (Prueba)
        </button>

        {/* 💡 2. Envolvemos el área arrastrable con DndContext */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto">
            {(currentBoard.columns || []).map((column) => (
              // 💡 Usamos ColumnContainer para envolver la lógica de SortableContext
              <ColumnContainer key={column._id} column={column} />
            ))}
          </div>
        </DndContext>
      </main>
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
