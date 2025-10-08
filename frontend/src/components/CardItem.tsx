import React, { useEffect, useState } from "react";
import { Card } from "../types/board";
import { useSortable } from "@dnd-kit/sortable"; // Hook para arrastrar y ordenar
import { CSS } from "@dnd-kit/utilities"; // Utilidad para aplicar transformaciones CSS

interface CardItemProps {
  card: Card;
}

// 💡 useSortable se usa porque las tarjetas se reordenan dentro de una columna.
export function CardItem({ card }: CardItemProps) {
  const [justMoved, setJustMoved] = useState(false);
  
  const {
    attributes, // Propiedades que deben ir al elemento DOM (roles, tabIndex)
    listeners, // Manejadores de eventos (onMouseDown, onTouchStart)
    setNodeRef, // Función para referenciar el nodo DOM (el <li>)
    transform, // El valor de transformación para mover el elemento
    transition, // La transición CSS para la animación
    isDragging, // Booleano que indica si el elemento se está arrastrando
  } = useSortable({
    id: card._id, // CLAVE: El ID que dnd-kit usará para identificar este elemento
    data: {
      // Objeto de datos opcional para pasar info extra
      type: "Card",
      card,
    },
  });

  // Detectar cuando la tarjeta se acaba de mover
  useEffect(() => {
    if (!isDragging && transform) {
      setJustMoved(true);
      const timer = setTimeout(() => setJustMoved(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isDragging, transform]);

  // Aplicamos las transformaciones y transiciones
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Transición suave al asentarse
    opacity: isDragging ? 0 : 1, // Completamente invisible durante el arrastre
    zIndex: isDragging ? 1000 : 'auto',
    listStyle: "none", // Removemos bullets
    cursor: "grab",
    // Mejorar el efecto visual durante el arrastre
    boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
    scale: isDragging ? 1.05 : 1,
    // Efecto de "asentamiento" cuando no se está arrastrando
    animation: !isDragging ? 'settleIn 0.4s ease-out' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-xl border-blue-300' : ''
      } ${
        justMoved ? 'animate-highlightMove' : ''
      }`}
    >
      <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>
      {card.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
      )}
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Posición: {card.position}</span>
        <span>{new Date(card.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
