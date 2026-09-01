/**
 * shared/tap — le contexte de tap NFC (partagé, comme le menu).
 * Le convive arrive via une puce ; l'app lit son uid et demande au serveur
 * QUI/OÙ il est (restaurant, table, service).
 */
import { API_BASE } from "../../apiBase";

export interface ContexteTap {
  restaurant: { id: string; slug: string; nom: string; ville: string };
  table: { id: string; libelle: string } | null;
  service: "midi" | "soir";
  cible: { kind: string };
  lang: string;
}

// Appelle GET /t/{uid} (proxifié vers l'API FastAPI). encodeURIComponent gère
// les caractères spéciaux de l'uid (il contient des « : »).
export async function fetchTap(uid: string): Promise<ContexteTap> {
  const res = await fetch(`${API_BASE}/t/${encodeURIComponent(uid)}`);
  if (!res.ok) throw new Error(`tap ${res.status}`);
  return res.json();
}
