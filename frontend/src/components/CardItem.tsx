import React from "react";
import { Card } from "../types/board";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CardItemProps {
  card: Card;
}

export function CardItem({ card }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: {
      type: "Card",
      card,
    },
  });

  // 👇 MEJORA: Transición suave sin retrocesos
  const style = {
    transform: CSS.Transform.toString(transform),
    // Sin transición mientras se arrastra, suave al asentar
    transition: isDragging
      ? "none"
      : transition || "transform 250ms cubic-bezier(0.2, 0, 0, 1)",
    // Invisible durante el arrastre (DragOverlay lo muestra)
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : ("auto" as any),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? "ring-2 ring-blue-400 ring-offset-2" : ""
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
