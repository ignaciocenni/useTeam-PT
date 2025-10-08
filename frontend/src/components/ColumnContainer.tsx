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
    <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {column.title}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        <SortableContext
          items={cardIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[200px]">
            {(column.cards || []).map((card) => (
              <CardItem key={card._id} card={card} />
            ))}
            
            {column.cards.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">No hay tareas</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
