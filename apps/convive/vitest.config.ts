/**
 * vitest.config.ts — configuration des tests du frontend Convive.
 *
 * On sépare cette config de `vite.config.ts` (celle de l'app) à dessein : en
 * test on n'a besoin NI de la PWA, NI de Tailwind, NI du proxy. On ne garde que
 * le plugin React (indispensable pour compiler le JSX/TSX des composants).
 *
 * Vitest choisit automatiquement `vitest.config.ts` s'il existe (sinon il lit
 * `vite.config.ts`). `defineConfig` vient de "vitest/config" : c'est celui de
 * Vite, enrichi du bloc `test`.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom = un faux navigateur (document, window…) pour tester des composants
    // React hors d'un vrai navigateur. Sans lui, `render()` n'aurait pas de DOM.
    environment: "jsdom",
    // globals: true → `describe/it/expect/vi` disponibles sans les importer,
    // ET le nettoyage auto du DOM entre tests (Testing Library) est branché.
    globals: true,
    // Fichier joué avant chaque fichier de test (matchers jest-dom, etc.).
    setupFiles: "./src/test/setup.ts",
    // On ne charge pas le vrai CSS en test (inutile, et coûteux).
    css: false,
  },
});
