import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Proxy partagé par le serveur de dev ET la preview : /api -> API Python (FastAPI).
const proxy = {
  // /api pointe sur l'API PYTHON (FastAPI, port 8010).
  // Filet de sécurité : repasser sur 3001 (API Node) en cas de souci.
  "/api": "http://localhost:8010",
  // /t (résolution de tap NFC) : désormais portée en Python (FastAPI).
  "/t": "http://localhost:8010",
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // ── PWA : rend l'app installable et résiliente au réseau ──────────
    VitePWA({
      // autoUpdate : le service worker se met à jour tout seul quand on
      // redéploie une nouvelle version (pas de bouton "recharger" à gérer).
      registerType: "autoUpdate",
      includeAssets: ["tabla-icon.svg"],
      // Le MANIFEST : ce qui rend l'app installable (nom, icônes, couleurs,
      // affichage plein écran). vite-plugin-pwa génère le fichier
      // manifest.webmanifest et l'injecte dans index.html tout seul.
      manifest: {
        name: "Maison Salice",
        short_name: "Salice",
        description: "La carte de Maison Salice — Tabla",
        lang: "fr",
        start_url: "/",
        display: "standalone", // plein écran, sans barre d'URL
        orientation: "portrait",
        background_color: "#1c1a17",
        theme_color: "#1c1a17",
        icons: [
          { src: "tabla-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "tabla-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      // Le SERVICE WORKER : stratégies de cache (généré par Workbox).
      workbox: {
        // Navigation hors-ligne : servir la coquille de l'app depuis le cache.
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // La carte : réseau d'abord (données fraîches), cache en secours
            // si le réseau tombe → l'app reste consultable hors-ligne.
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-menu",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Les photos (Unsplash) : cache d'abord (elles ne changent pas).
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // SW désactivé en développement (le mode dev de vite-plugin-pwa est
      // capricieux et cacherait tes modifs). La PWA se teste/démontre en
      // version compilée : `pnpm build` puis `pnpm preview` (port 4173).
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
});
