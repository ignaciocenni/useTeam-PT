// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx'; // Asegúrate de que la extensión sea .tsx

const container = document.getElementById('root');

// SOLUCIÓN: Si container es null, lanzamos un error que detiene la app, 
// lo que garantiza a TypeScript que 'container' es un HTMLElement
if (!container) {
  throw new Error('No se encontró el elemento root. ¿Está main.tsx cargando correctamente?');
}

// Ahora TypeScript sabe que 'container' NO es null
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);