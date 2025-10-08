import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WSEventPayload } from "../types/board";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const useSocket = (boardId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastEvent, setLastEvent] = useState<WSEventPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [boardUsers, setBoardUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!boardId) return;

    // 1. Inicializar la conexión
    const newSocket = io(WS_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // 2. Manejar eventos del ciclo de vida del socket
    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log(`[WS] Conectado al servidor con ID: ${newSocket.id}`);
      
      // Unirse al board específico
      newSocket.emit("joinBoard", { boardId });
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      setBoardUsers([]);
      console.log("[WS] Desconectado del servidor. Razón:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[WS] Error de conexión:", error);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`[WS] Reconectado después de ${attemptNumber} intentos`);
      setIsConnected(true);
      // Re-unirse al board después de reconectar
      newSocket.emit("joinBoard", { boardId });
    });

    // 3. Eventos específicos del board
    newSocket.on("cardMoved", (payload) => {
      console.log("[WS] Card moved:", payload);
      setLastEvent({ eventName: "cardMoved", payload });
    });

    newSocket.on("cardCreated", (payload) => {
      console.log("[WS] Card created:", payload);
      console.log("[WS] Setting lastEvent with:", { eventName: "cardCreated", payload });
      setLastEvent({ eventName: "cardCreated", payload });
    });

    newSocket.on("cardDeleted", (payload) => {
      console.log("[WS] Card deleted:", payload);
      setLastEvent({ eventName: "cardDeleted", payload });
    });

    newSocket.on("userJoined", (payload) => {
      console.log("[WS] User joined:", payload);
      setBoardUsers(prev => [...prev, payload.userId]);
    });

    newSocket.on("userLeft", (payload) => {
      console.log("[WS] User left:", payload);
      setBoardUsers(prev => prev.filter(id => id !== payload.userId));
    });

    setSocket(newSocket);

    // 4. Cleanup
    return () => {
      if (boardId) {
        newSocket.emit("leaveBoard", { boardId });
      }
      newSocket.disconnect();
    };
  }, [boardId]);

  return { socket, isConnected, lastEvent, boardUsers };
};
