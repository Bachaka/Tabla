/**
 * session.ts — le slug du restaurant connecté, partagé via un Context React.
 *
 * Plutôt que de faire descendre le slug en prop dans chaque écran (Dashboard,
 * Puces NFC, Zones de tables…), on le publie dans un « Context ». N'importe
 * quel écran le récupère avec useSlug().
 */
import { createContext, useContext } from "react";

// Valeur par défaut "" (jamais utilisée en pratique : App fournit le vrai slug).
export const SlugContext = createContext<string>("");

/** Récupère le slug du restaurant courant. */
export const useSlug = () => useContext(SlugContext);
