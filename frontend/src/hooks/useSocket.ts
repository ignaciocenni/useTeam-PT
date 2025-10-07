import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WSEventPayload } from "../types/board";

// La URL de WebSockets la leemos de las variables de entorno
const WS_URL = import.meta.env.VITE_WS_URL;

export const useSocket = (boardId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastEvent, setLastEvent] = useState<WSEventPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Si no hay un boardId seleccionado, no hacemos nada (podríamos usar esto para futuros tableros)
    if (!boardId) return;

    // 1. Inicializar la conexión
    const newSocket = io(WS_URL, {
      // Opciones para asegurar la conexión
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    // 2. Manejar eventos del ciclo de vida del socket
    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log(`[WS] Conectado al servidor con ID: ${newSocket.id}`);

      // Podrías añadir lógica de 'join room' aquí si fuera necesario
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[WS] Desconectado del servidor.");
    });

    // 3. 🚨 Escuchar el evento clave del backend
    // Recuerda que el nombre verificado fue 'boardUpdated'
    newSocket.on("boardUpdated", (payload: WSEventPayload) => {
      console.log("[WS] Evento recibido:", payload.eventName);
      setLastEvent(payload); // Almacenamos el último evento para que el Context lo procese
    });

    setSocket(newSocket);

    // 4. Cleanup: Desconectar el socket al desmontar el componente
    return () => {
      newSocket.disconnect();
    };
  }, [boardId]); // Se re-ejecuta si el boardId cambia

  return { socket, isConnected, lastEvent };
};
