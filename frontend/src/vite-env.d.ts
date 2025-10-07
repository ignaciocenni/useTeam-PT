// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  // Agrega aquí cualquier otra variable VITE_ que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
