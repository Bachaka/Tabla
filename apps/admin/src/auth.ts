/**
 * auth.ts — authentification du front Admin.
 *
 * • Le token JWT est gardé dans localStorage (choix « Bearer + localStorage »).
 * • authFetch() ajoute automatiquement l'en-tête Authorization à chaque requête.
 * • login/fetchMe/logout pilotent la session.
 */

const TOKEN_KEY = "tabla_admin_token";

// Préfixe des appels API : absolu en prod (VITE_API_URL), relatif en dev.
const API_BASE: string = import.meta.env.VITE_API_URL ?? "";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
  restaurantSlug: string | null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** fetch enrichi du header Authorization (si on est connecté). */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // Préfixe l'URL par l'API distante en prod (les chemins sont des chaînes "/api/...").
  const url = typeof input === "string" ? API_BASE + input : input;
  return fetch(url, { ...init, headers });
}

/** Connexion : stocke le token et renvoie l'utilisateur. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const detail = await res.json().then((j) => j.detail).catch(() => null);
    throw new Error(detail === "invalid_credentials" ? "Identifiants incorrects." : (detail ?? `HTTP ${res.status}`));
  }
  const data = await res.json();
  setToken(data.accessToken);
  return data.user as AuthUser;
}

/** Récupère l'utilisateur courant à partir du token (valide le token au démarrage). */
export async function fetchMe(): Promise<AuthUser> {
  const res = await authFetch("/api/v1/auth/me");
  if (!res.ok) throw new Error(`me ${res.status}`);
  return res.json();
}

export function logout() {
  clearToken();
}
