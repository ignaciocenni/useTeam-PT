import React from "react";
import { Column } from "../types/board";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"; // Contexto de ordenamiento
import { CardItem } from "./CardItem"; // Importamos el componente de tarjeta arrastrable

interface ColumnContainerProps {
  column: Column;
}

// ColumnContainer solo sirve como DROP-ZONE y contenedor de las tarjetas ordenables
export function ColumnContainer({ column }: ColumnContainerProps) {
  // Obtenemos los IDs de las tarjetas para el SortableContext
  const cardIds = column.cards.map((card) => card._id);

  return (
    <div className="w-80 flex-shrink-0 bg-gray-100 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-800">
        {column.title} ({column.cards.length})
      </h3>

      {/* 💡 SortableContext le dice a dnd-kit qué IDs son ordenables aquí */}
      <SortableContext
        items={cardIds} // Array de IDs de las tarjetas
        strategy={verticalListSortingStrategy} // Estrategia para reordenar verticalmente
      >
        <ul className="space-y-2 min-h-[10px]">
          {/* Mapeamos las tarjetas usando el nuevo componente CardItem */}
          {(column.cards || []).map((card) => (
            <CardItem key={card._id} card={card} />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}
