/**
 * Client API de la console Admin. Clés au contrat français.
 */
import { authFetch } from "./auth";

// ── Vue d'ensemble (cockpit) ───────────────────────────────────────────
export interface RestaurantRollup {
  nom: string;
  slug: string;
  ville: string;
  taps: number;
}

export interface OverviewAdmin {
  nbRestaurants: number;
  nbTables: number;
  nbPuces: number;
  totalTaps: number;
  totalEvenements: number;
  restaurants: RestaurantRollup[];
}

export async function fetchOverview(): Promise<OverviewAdmin> {
  const res = await authFetch("/api/v1/admin/overview");
  if (!res.ok) throw new Error(`overview ${res.status}`);
  return res.json();
}

// ── Parc NFC ───────────────────────────────────────────────────────────
export type StatutPuce = "approvisionnee" | "appairee" | "desactivee" | "defaillante";

export interface TagAdmin {
  id: string;
  uidCourt: string;
  uid: string;
  statut: StatutPuce;
  nomRestaurant: string | null;
  libelleTable: string | null;
  typeCible: string;
}

export async function fetchTags(): Promise<TagAdmin[]> {
  const res = await authFetch("/api/v1/admin/tags");
  if (!res.ok) throw new Error(`tags ${res.status}`);
  return res.json();
}

export interface TagDetail extends TagAdmin {
  tapsTable: number; // taps enregistrés sur la table de cette puce
}

export async function fetchTagDetail(id: string): Promise<TagDetail> {
  const res = await authFetch(`/api/v1/admin/tags/${id}`);
  if (!res.ok) throw new Error(`tag ${res.status}`);
  return res.json();
}

/** Crée un lot de `quantite` puces rattachées à `restaurantId`. */
export async function createLot(restaurantId: string, quantite: number): Promise<TagAdmin[]> {
  const res = await send("POST", "/api/v1/admin/tags", { restaurantId, quantite });
  if (!res.ok) throw new Error(await errDetail(res));
  return res.json();
}

// ── CRM Restaurants clients ────────────────────────────────────────────
export interface RestaurantRow {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  forfait: string;
  scoreSante: number;
  mrr: number;
  statutFacturation: string;
  note: number | null;
  tags: number;
  taps: number;
}

export interface RestaurantIn {
  nom: string;
  slug: string;
  ville: string;
  forfait: string;
  scoreSante: number;
  mrr: number;
  statutFacturation: string;
  note: number | null;
}

export async function fetchRestaurants(): Promise<RestaurantRow[]> {
  const res = await authFetch("/api/v1/admin/restaurants");
  if (!res.ok) throw new Error(`restaurants ${res.status}`);
  return res.json();
}

async function send(method: string, url: string, body?: unknown): Promise<Response> {
  return authFetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Renvoie un message d'erreur métier (detail) si la réponse n'est pas OK. */
async function errDetail(res: Response): Promise<string> {
  try {
    return (await res.json()).detail ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function createRestaurant(b: RestaurantIn): Promise<RestaurantRow> {
  const res = await send("POST", "/api/v1/admin/restaurants", b);
  if (!res.ok) throw new Error(await errDetail(res));
  return res.json();
}

export async function updateRestaurant(id: string, b: RestaurantIn): Promise<RestaurantRow> {
  const res = await send("PUT", `/api/v1/admin/restaurants/${id}`, b);
  if (!res.ok) throw new Error(await errDetail(res));
  return res.json();
}

export async function deleteRestaurant(id: string): Promise<void> {
  const res = await send("DELETE", `/api/v1/admin/restaurants/${id}`);
  if (!res.ok) throw new Error(await errDetail(res));
}

// ── Stats d'un restaurant (pour la courbe du cockpit) ──────────────────
export interface StatsRestaurant {
  totalTaps: number;
  totalVuesPlats: number;
  tapsParTable: Array<{ libelle: string; taps: number }>;
  platsLesPlusVus: Array<{ nom: { fr: string }; vues: number }>;
}

export async function fetchStats(slug: string): Promise<StatsRestaurant> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/stats`);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json();
}
