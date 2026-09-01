/**
 * auth.ts — authentification du back-office Restaurateur.
 * Même mécanique que l'Admin, mais clé de token distincte (apps séparées).
 */

const TOKEN_KEY = "tabla_resto_token";

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

/** fetch enrichi du header Authorization (si connecté). */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const url = typeof input === "string" ? API_BASE + input : input;
  return fetch(url, { ...init, headers });
}

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

export async function fetchMe(): Promise<AuthUser> {
  const res = await authFetch("/api/v1/auth/me");
  if (!res.ok) throw new Error(`me ${res.status}`);
  return res.json();
}

export function logout() {
  clearToken();
}
