import React from "react";
import { Card } from "../types/board";
import { useSortable } from "@dnd-kit/sortable"; // Hook para arrastrar y ordenar
import { CSS } from "@dnd-kit/utilities"; // Utilidad para aplicar transformaciones CSS

interface CardItemProps {
  card: Card;
}

// 💡 useSortable se usa porque las tarjetas se reordenan dentro de una columna.
export function CardItem({ card }: CardItemProps) {
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

  // Aplicamos las transformaciones y transiciones
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Hacemos la tarjeta semi-transparente al arrastrar
    listStyle: "none", // Removemos bullets
    cursor: "grab",
  };

  return (
    <li
      ref={setNodeRef} // Asignamos la referencia al nodo DOM
      style={style}
      {...attributes} // Asignamos los atributos
      {...listeners} // Asignamos los manejadores de eventos (para arrastrar)
      className="bg-white p-3 rounded shadow-sm text-sm border border-gray-200 hover:shadow-md"
    >
      {card.title}
    </li>
  );
}
