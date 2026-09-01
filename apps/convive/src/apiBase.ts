/**
 * apiBase — préfixe des appels API.
 *
 * • En dev : VITE_API_URL est absent → "" → appels relatifs (`/api/...`),
 *   proxifiés vers l'API FastAPI par Vite.
 * • En prod : VITE_API_URL = l'URL de l'App Service → appels absolus (cross-origin,
 *   autorisés par le CORS côté API).
 */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? "";
