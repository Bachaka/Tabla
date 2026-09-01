/**
 * Tabla — modèle de domaine partagé par les trois surfaces.
 * Dérivé des schémas d'entités des prototypes (data.jsx Convive,
 * data.js Restaurateur, data-*.jsx Admin). Le prototype fait foi
 * sur la forme ; l'API fait foi sur la persistance.
 * Identifiants et champs en français (contrat de l'API).
 */

/** Langues supportées. FR est la langue source du contenu. */
export type Langue = "fr" | "en" | "es" | "de" | "it";

/** Texte localisable : FR obligatoire (source), autres langues optionnelles. */
export type TexteLocalise = { fr: string } & Partial<Record<Exclude<Langue, "fr">, string>>;

export type Service = "midi" | "soir";

export type Regime = "vegetarien" | "vegan" | "sansGluten";

/** Allergènes affichés au convive (liste réglementaire simplifiée du proto). */
export type Allergene =
  | "Gluten"
  | "Lactose"
  | "Fruits à coque"
  | "Poisson"
  | "Crustacés"
  | "Œufs"
  | "Soja"
  | "Céleri"
  | "Sulfites";

// ---------------------------------------------------------------------------
// Établissement (tenant)
// ---------------------------------------------------------------------------

export interface Restaurant {
  id: string;
  slug: string;
  nom: string;
  ville: string;
  /** Message du chef affiché à l'arrivée (rotation / personnalisation IA côté serveur). */
  motChef: TexteLocalise | null;
  signatureChef: string | null;
  urlAmbiance: string | null;
  /** Langues activées pour la carte convive. */
  langues: Langue[];
}

export interface Table {
  id: string;
  restaurantId: string;
  /** Numéro affiché ("07"). */
  libelle: string;
  zoneId: string | null;
}

export interface Zone {
  id: string;
  restaurantId: string;
  nom: string;
}

// ---------------------------------------------------------------------------
// NFC
// ---------------------------------------------------------------------------

export type StatutPuce = "approvisionnee" | "appairee" | "desactivee" | "defaillante";

/** Cible d'une puce : ce que le tap ouvre. Résolue CÔTÉ SERVEUR. */
export type CiblePuce =
  | { kind: "menu" }
  | { kind: "fixedMenu"; menuId: string }
  | { kind: "schedule"; midi: CiblePuce; soir: CiblePuce }
  | { kind: "event"; menuId: string };

export interface PuceNfc {
  id: string;
  /** UID matériel de la puce (mono, affiché en JetBrains Mono). */
  uid: string;
  restaurantId: string | null;
  tableId: string | null;
  statut: StatutPuce;
  cible: CiblePuce;
}

/** Réponse du serveur à un tap : le contexte complet de la session convive. */
export interface ResolutionTap {
  restaurant: Restaurant;
  table: Pick<Table, "id" | "libelle"> | null;
  service: Service;
  lang: Langue;
  cible: CiblePuce;
}

// ---------------------------------------------------------------------------
// Producteurs
// ---------------------------------------------------------------------------

export interface Producteur {
  id: string;
  restaurantId: string;
  prenom: string;
  atelier: string;
  role: TexteLocalise;
  village: string;
  /** Distance au restaurant, pour la carte du territoire. */
  km: number;
  /** Cap depuis le restaurant en degrés (placement sur la carte du territoire). */
  cap: number;
  labels: string[];
  histoire: TexteLocalise;
  urlPortrait: string | null;
  urlAtelier: string | null;
  /** Produits « en ce moment » (saison). */
  saison: string[];
}

// ---------------------------------------------------------------------------
// Carte
// ---------------------------------------------------------------------------

export type CategoriePlat = "Entrées" | "Plats" | "Desserts" | "Vins";

export interface ItemComposition {
  libelle: TexteLocalise;
  /** Lien producteur ; null si hors circuit (ex. burrata des Pouilles). */
  producteurId: string | null;
}

export interface NutritionPlat {
  kcal: number | null;
  /** Mentions qualitatives (« riche en fer », « oméga-3 »)… clés de filtres « envie ». */
  qualites: string[];
}

export interface Plat {
  id: string;
  restaurantId: string;
  categorie: CategoriePlat;
  nom: TexteLocalise;
  resume: TexteLocalise;
  description: TexteLocalise;
  /** Le tour de main raconté (« Le geste »). */
  geste: TexteLocalise | null;
  prix: number;
  signature: boolean;
  regimes: Regime[];
  allergenes: Allergene[];
  /** null = servi aux deux services. */
  service: Service | null;
  urlPhoto: string | null;
  composition: ItemComposition[];
  nutrition: NutritionPlat | null;
  /** Disponibilité pilotée par le back-office (« épuisé »). */
  disponible: boolean;
}

/**
 * Métadonnées vin d'un plat de catégorie « Vins » (cave de Marius).
 * Le proto modélise les vins comme des plats ; les accords pointent des platId.
 */
export interface DetailVin {
  platId: string;
  cepages: string[];
  /** Humeur de dégustation ("salin", "poisson", "viande"). */
  humeur: string;
  couleur: "rouge" | "rosé" | "blanc";
}

/** Accord mets-vin : un plat ↔ un plat-vin, avec justification éditoriale. */
export interface Accord {
  platId: string;
  platVinId: string;
  note: TexteLocalise;
}

/** Menu dégustation (« Le Menu de la Cheffe ») : services ordonnés et commentés. */
export interface ServiceDegustation {
  num: string;
  platId: string;
  role: TexteLocalise;
  ligne: TexteLocalise;
}

export interface MenuDegustation {
  id: string;
  restaurantId: string;
  nom: TexteLocalise;
  intro: TexteLocalise;
  prix: number | null;
  prixAccord: number | null;
  services: ServiceDegustation[];
}

// ---------------------------------------------------------------------------
// Contenu éditorial (histoire, engagement, équipe, lieu…)
// ---------------------------------------------------------------------------

/**
 * Le prototype contient ~20 blocs éditoriaux (HOUSE_STORY, COMMITMENT, TEAM,
 * VENUE, FAREWELL…). Plutôt que 20 tables, un bloc = une clé + un contenu
 * localisé. L'Admin édite, le Convive consomme.
 */
export interface BlocContenu {
  restaurantId: string;
  cle: string;
  contenu: unknown;
}

// ---------------------------------------------------------------------------
// Engagement (anonyme — dissocié du compte convive, RGPD by design)
// ---------------------------------------------------------------------------

export type TypeEvenement =
  | "tap"
  | "retap"
  | "vue_plat"
  | "vue_producteur"
  | "appel_serveur"
  | "demande_addition"
  | "ajout_selection";

export interface Evenement {
  id: string;
  restaurantId: string;
  tableId: string | null;
  type: TypeEvenement;
  /** Entité concernée (platId, producteurId…) selon le type. */
  sujetId: string | null;
  service: Service;
  survenuLe: string;
}
