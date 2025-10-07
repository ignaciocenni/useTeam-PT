import axios from "axios";

// Configuración base de Axios
// Todas las requests usarán esta URL base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Lee la variable del .env
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== BOARDS ====================

// Obtener todos los tableros
export const getAllBoards = async () => {
  const response = await api.get("/api/v1/boards");
  return response.data; // Axios guarda los datos en response.data
};

// Crear un nuevo tablero
export const createBoard = async (title, description) => {
  const response = await api.post("/api/v1/boards", { title, description });
  return response.data;
};

// Actualizar un tablero
export const updateBoard = async (boardId, updates) => {
  const response = await api.patch(`/api/v1/boards/${boardId}`, updates);
  return response.data;
};

// Eliminar un tablero
export const deleteBoard = async (boardId) => {
  const response = await api.delete(`/api/v1/boards/${boardId}`);
  return response.data;
};

// Obtener un tablero por ID
export const getBoard = async (boardId) => {
  // Ruta: /api/v1/boards/:boardId
  const response = await api.get(`/api/v1/boards/${boardId}`);
  // El backend devuelve Board con Columns y Cards anidadas
  return response.data;
};

// ==================== COLUMNS ====================

// Obtener columnas de un tablero
export const getColumnsByBoard = async (boardId) => {
  const response = await api.get(`/api/v1/boards/${boardId}/columns`);
  return response.data;
};

// Crear una columna
export const createColumn = async (boardId, title, position) => {
  const response = await api.post(`/api/v1/boards/${boardId}/columns`, {
    title,
    position,
  });
  return response.data;
};

// Eliminar una columna
export const deleteColumn = async (boardId, columnId) => {
  const response = await api.delete(
    `/api/v1/boards/${boardId}/columns/${columnId}`
  );
  return response.data;
};

// ==================== CARDS ====================

// Obtener tarjetas de una columna
export const getCardsByColumn = async (boardId, columnId) => {
  const response = await api.get(
    `/api/v1/boards/${boardId}/columns/${columnId}/cards`
  );
  return response.data;
};

// Crear una tarjeta
export const createCard = async (
  boardId,
  columnId,
  title,
  description,
  position
) => {
  const response = await api.post(
    `/api/v1/boards/${boardId}/columns/${columnId}/cards`,
    {
      title,
      description,
      position,
    }
  );
  return response.data;
};

// Actualizar una tarjeta (moverla, cambiar texto, etc.)
export const updateCard = async (boardId, columnId, cardId, updates) => {
  const response = await api.patch(
    `/api/v1/boards/${boardId}/columns/${columnId}/cards/${cardId}`,
    updates
  );
  return response.data;
};

// Eliminar una tarjeta
export const deleteCard = async (boardId, columnId, cardId) => {
  const response = await api.delete(
    `/api/v1/boards/${boardId}/columns/${columnId}/cards/${cardId}`
  );
  return response.data;
};

export default api;
