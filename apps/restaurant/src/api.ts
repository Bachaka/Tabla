/**
 * Client API du back-office Restaurateur. Consomme les stats d'engagement
 * servies par l'API FastAPI (proxifiées via /api). Clés au contrat français.
 */
import { authFetch } from "./auth";

export interface TableStat {
  libelle: string;
  taps: number;
}

export interface PlatStat {
  nom: { fr: string };
  vues: number;
}

export interface StatsRestaurant {
  totalTaps: number;
  totalVuesPlats: number;
  tapsParTable: TableStat[];
  platsLesPlusVus: PlatStat[];
}

export async function fetchStats(slug: string): Promise<StatsRestaurant> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/stats`);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json();
}

// Nombre de plats à la carte (via l'endpoint menu).
export interface Menu {
  plats: unknown[];
  producteurs: unknown[];
}

export async function fetchMenu(slug: string): Promise<Menu> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/menu`);
  if (!res.ok) throw new Error(`menu ${res.status}`);
  return res.json();
}

// ── Appairage puce ↔ table (écran « Puces NFC ») ───────────────────────
export type StatutPuce = "approvisionnee" | "appairee" | "desactivee" | "defaillante";

export interface TableRow {
  id: string;
  libelle: string;
  zoneId: string | null;
  zone: string | null;
  occupee: boolean; // une puce est déjà posée sur cette table
}

export interface TagRow {
  id: string;
  uidCourt: string;
  uid: string;
  statut: StatutPuce;
  tableId: string | null;
  libelleTable: string | null;
}

export async function fetchTables(slug: string): Promise<TableRow[]> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tables`);
  if (!res.ok) throw new Error(`tables ${res.status}`);
  return res.json();
}

export async function fetchTags(slug: string): Promise<TagRow[]> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tags`);
  if (!res.ok) throw new Error(`tags ${res.status}`);
  return res.json();
}

/** Pose la puce sur `tableId`, ou la retire si `tableId` est null. */
export async function pairTag(slug: string, id: string, tableId: string | null): Promise<TagRow> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tags/${id}/pair`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableId }),
  });
  if (!res.ok) {
    const detail = await res.json().then((j) => j.detail).catch(() => null);
    throw new Error(detail ?? `pair ${res.status}`);
  }
  return res.json();
}

// ── Gestion des tables & zones (écran « Zones de tables ») ──────────────
export interface ZoneRow {
  id: string;
  nom: string;
}

export interface TableIn {
  libelle: string;
  zoneId: string | null;
}

/** Extrait le `detail` d'une réponse d'erreur (message métier), sinon un fallback. */
async function detailErr(res: Response): Promise<string> {
  const d = await res.json().then((j) => j.detail).catch(() => null);
  return d ?? `HTTP ${res.status}`;
}

export async function fetchZones(slug: string): Promise<ZoneRow[]> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/zones`);
  if (!res.ok) throw new Error(`zones ${res.status}`);
  return res.json();
}

export async function createZone(slug: string, nom: string): Promise<ZoneRow> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom }),
  });
  if (!res.ok) throw new Error(await detailErr(res));
  return res.json();
}

export async function createTable(slug: string, body: TableIn): Promise<TableRow> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await detailErr(res));
  return res.json();
}

export async function updateTable(slug: string, id: string, body: TableIn): Promise<TableRow> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tables/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await detailErr(res));
  return res.json();
}

export async function deleteTable(slug: string, id: string): Promise<void> {
  const res = await authFetch(`/api/v1/restaurants/${slug}/tables/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await detailErr(res));
}
