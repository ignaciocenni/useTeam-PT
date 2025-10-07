/*function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
      </header>
      <main className="container mx-auto p-4">
        <p className="text-gray-700">
          Frontend funcionando con Tailwind CSS ✅
        </p>
      </main>
    </div>
  );
}

export default App;*/

import { useEffect, useState } from "react";
import { getAllBoards } from "./services/api";

function App() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Este hook se ejecuta cuando el componente se monta
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await getAllBoards();
        setBoards(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBoards();
  }, []); // [] = solo se ejecuta una vez al montar

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
      </header>
      <main className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Tableros disponibles:</h2>
        {boards.length === 0 ? (
          <p className="text-gray-600">No hay tableros creados</p>
        ) : (
          <ul className="space-y-2">
            {boards.map((board) => (
              <li key={board._id} className="bg-white p-4 rounded shadow">
                <h3 className="font-bold">{board.title}</h3>
                <p className="text-sm text-gray-600">{board.description}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
