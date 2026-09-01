import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Console Admin (cockpit interne Lamiba). Consomme l'API FastAPI (8010).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5176,
    proxy: {
      "/api": "http://localhost:8010",
    },
  },
});
