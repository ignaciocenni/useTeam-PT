import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const container = document.getElementById("root");

// Verificación obligatoria para TypeScript
if (!container) {
  throw new Error("No se encontró el elemento root.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
