import { useBoard, BoardProvider } from "./context/BoardContext";
import { Card } from "./types/board";
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
} from "@dnd-kit/core";
import { ColumnContainer } from "./components/ColumnContainer"; // <-- Importado correctamente

// ----------------------------------------------------
// Componente principal de visualización del tablero
// ----------------------------------------------------
function BoardPageContent() {
  const { currentBoard, loading, error, isConnected, createCard } = useBoard();

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

  // Función que se llama cuando se suelta un elemento
  const handleDragEnd = (event: any) => {
    const { active, over } = event; // 'active' es el elemento que se arrastró; 'over' es el elemento sobre el que se soltó.

    // Si soltamos el elemento fuera de cualquier zona válida, no hacemos nada
    if (!over) {
      console.log("Arrastre finalizado fuera de una zona válida.");
      return;
    }

    console.log(`Elemento arrastrado (ID): ${active.id}`);
    console.log(`Elemento soltado sobre (ID): ${over.id}`);

    // Aquí irá la lógica para mover la tarjeta y llamar a la API
  };

  // Definimos el sensor de puntero con un pequeño retraso
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // La persona debe mover el puntero al menos 8px para considerarlo arrastre
      },
    })
  );

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

        {/* 💡 2. Envolvemos el área arrastrable con DndContext */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto">
            {(currentBoard.columns || []).map((column) => (
              // 💡 REEMPLAZO CRÍTICO: Usamos el componente ColumnContainer
              // que contiene la lógica de SortableContext para las tarjetas.
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
