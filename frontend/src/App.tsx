import { useBoard, BoardProvider } from "./context/BoardContext";
import { Card } from "./types/board";

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
      {/* ... header code ... */}

      <main className="container mx-auto p-4">
        {/* Botón de prueba de Creación de Tarjeta */}
        <button
          onClick={handleCreateTestCard}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-4 shadow"
          // 💡 FIX 1: Usamos Optional Chaining (?) para evitar el crash si 'columns' es undefined.
          disabled={!isConnected || currentBoard.columns?.length === 0}
        >
          {/* ... button content ... */}
        </button>

        {/* Renderizado de Columnas (estructura simple) */}
        <div className="flex space-x-4 overflow-x-auto">
          {/* 💡 FIX 2: Usamos || [] para garantizar que si 'columns' es undefined, mapeamos un array vacío. */}
          {(currentBoard.columns || []).map((column) => (
            <div
              key={column._id}
              className="w-80 flex-shrink-0 bg-white p-4 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                {column.title}
              </h3>
              {/* Renderizar tarjetas (aplicando el mismo chequeo de seguridad) */}
              <ul className="space-y-2">
                {(column.cards || []).map((card: Card) => (
                  <li
                    key={card._id}
                    className="bg-gray-50 p-3 rounded shadow-sm text-sm"
                  >
                    {card.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
