import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Back-office Restaurateur (desktop-first). Consomme l'API FastAPI (8010).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    proxy: {
      "/api": "http://localhost:8010",
    },
  },
});
