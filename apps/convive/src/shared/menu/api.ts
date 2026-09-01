/**
 * shared/menu — le menu est UNE donnée partagée (un seul appel API renvoie
 * restaurant + plats + producteurs), consommée par plusieurs features. En VSA,
 * ce qui est partagé vit dans shared/ (jamais un feature qui importe un autre).
 *
 * Client API + types de la carte. Les clés suivent le contrat français de l'API.
 */
import type { Regime, Service, TexteLocalise } from "@tabla/data";

import { API_BASE } from "../../apiBase";

export interface Plat {
  id: string;
  code: string;
  categorie: "Entrées" | "Plats" | "Desserts" | "Vins";
  nom: TexteLocalise;
  resume: TexteLocalise;
  description: TexteLocalise;
  prix: string;
  signature: boolean;
  regimes: Regime[];
  allergenes: string[];
  service: Service | null;
  urlPhoto: string | null;
  disponible: boolean;
  composition: Array<{ libelle: TexteLocalise; producteurId: string | null }>;
  pairing: { platVinId: string; note: TexteLocalise } | null;
}

export interface Producteur {
  id: string;
  code: string;
  prenom: string;
  atelier: string;
  role: TexteLocalise;
  village: string;
  km: number;
  cap: number;
  latitude: number | null;
  longitude: number | null;
  labels: string[];
  histoire: TexteLocalise;
  urlPortrait: string | null;
  urlAtelier: string | null;
  saison: string[];
}

export interface Carte {
  restaurant: {
    id: string;
    slug: string;
    nom: string;
    ville: string;
    latitude: number | null;
    longitude: number | null;
    langues: string[]; // langues activées, ex. ["fr", "en"] → pilote le sélecteur
  };
  categories: string[];
  plats: Plat[];
  producteurs: Producteur[];
}

// API versionnée : /api/v1 (le proxy Vite envoie /api vers l'API FastAPI 8010).
export async function fetchMenu(slug: string): Promise<Carte> {
  const res = await fetch(`${API_BASE}/api/v1/restaurants/${slug}/menu`);
  if (!res.ok) throw new Error(`menu ${res.status}`);
  return res.json();
}
