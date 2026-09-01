/**
 * shared/i18n — internationalisation du Convive (NSY209 : carte multilingue).
 *
 * Deux natures de textes coexistent :
 *  1. CONTENU (venu de la base) : champs localisés { fr, en, … } → helper `t()`,
 *     qui choisit la langue courante et RETOMBE sur le français si la traduction
 *     manque (le fr est la langue source, toujours présente).
 *  2. INTERFACE (libellés de l'app : boutons, titres) : un dictionnaire `MESSAGES`
 *     par langue → helper `tm(cle)`.
 *
 * La langue courante vit dans un Contexte React (LangProvider), mémorisée dans
 * localStorage. Les composants lisent tout via le hook `useI18n()`.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "fr" | "en" | "es" | "de" | "it";

/** Nom affiché de chaque langue (dans le sélecteur). */
export const NOM_LANGUE: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
};

/** Un texte localisé tel que l'API le renvoie : fr obligatoire, reste optionnel. */
export type TexteLocalise = { fr: string } & Partial<Record<Exclude<Lang, "fr">, string>>;

/** CONTENU : renvoie la version `lang`, sinon le français (repli), sinon "". */
export function t(texte: TexteLocalise | undefined, lang: Lang): string {
  if (!texte) return "";
  return texte[lang] ?? texte.fr ?? "";
}

// ── Dictionnaire d'INTERFACE ────────────────────────────────────────────
// Clés = identifiants stables ; valeurs = libellé par langue. On fournit fr + en
// (les langues de la maison). Ajouter une langue = ajouter sa colonne ici.
export type Cle =
  | "tab_menu" | "tab_producers"
  | "eyebrow_midi" | "eyebrow_soir" | "table"
  | "svc_midi_title" | "svc_soir_title" | "svc_midi" | "svc_soir"
  | "svc_voir_soir" | "svc_voir_midi"
  | "filtre_tous" | "filtre_vegetarien" | "filtre_vegan" | "filtre_sansGluten" | "filtre_signature"
  | "signature" | "signature_maison" | "epuise"
  | "cat_Entrées" | "cat_Plats" | "cat_Desserts" | "cat_Vins"
  | "ecouter" | "arreter" | "composition" | "allergenes"
  | "prod_eyebrow" | "prod_titre" | "prod_sub"
  | "vue_annuaire" | "vue_carte" | "ateliers_autour" | "carte_indispo"
  | "maintenant" | "atelier" | "langue";

const MESSAGES: Record<"fr" | "en", Record<Cle, string>> = {
  fr: {
    tab_menu: "Carte",
    tab_producers: "Producteurs",
    eyebrow_midi: "Ce midi",
    eyebrow_soir: "Ce soir",
    table: "Table",
    svc_midi_title: "Le service du midi",
    svc_soir_title: "La carte de ce soir",
    svc_midi: "Midi",
    svc_soir: "Soir",
    svc_voir_soir: "Voir le soir",
    svc_voir_midi: "Voir le midi",
    filtre_tous: "Tout",
    filtre_vegetarien: "Végétarien",
    filtre_vegan: "Vegan",
    filtre_sansGluten: "Sans gluten",
    filtre_signature: "Signature",
    signature: "Signature",
    signature_maison: "Signature de la maison",
    epuise: "Épuisé ce soir",
    "cat_Entrées": "Entrées",
    cat_Plats: "Plats",
    cat_Desserts: "Desserts",
    cat_Vins: "Vins",
    ecouter: "Écouter",
    arreter: "Arrêter",
    composition: "Composition",
    allergenes: "Allergènes",
    prod_eyebrow: "Circuit court",
    prod_titre: "Nos producteurs",
    prod_sub: "Celles et ceux qui nourrissent la maison, du plus proche au plus loin.",
    vue_annuaire: "Annuaire",
    vue_carte: "Carte du territoire",
    ateliers_autour: "{n} ateliers autour de {nom}. Touchez un point pour la fiche.",
    carte_indispo: "Carte indisponible.",
    maintenant: "En ce moment",
    atelier: "L'atelier",
    langue: "Langue",
  },
  en: {
    tab_menu: "Menu",
    tab_producers: "Producers",
    eyebrow_midi: "Today's lunch",
    eyebrow_soir: "Tonight",
    table: "Table",
    svc_midi_title: "The lunch service",
    svc_soir_title: "Tonight's menu",
    svc_midi: "Lunch",
    svc_soir: "Dinner",
    svc_voir_soir: "See dinner",
    svc_voir_midi: "See lunch",
    filtre_tous: "All",
    filtre_vegetarien: "Vegetarian",
    filtre_vegan: "Vegan",
    filtre_sansGluten: "Gluten-free",
    filtre_signature: "Signature",
    signature: "Signature",
    signature_maison: "House signature",
    epuise: "Sold out tonight",
    "cat_Entrées": "Starters",
    cat_Plats: "Mains",
    cat_Desserts: "Desserts",
    cat_Vins: "Wines",
    ecouter: "Listen",
    arreter: "Stop",
    composition: "Composition",
    allergenes: "Allergens",
    prod_eyebrow: "Short supply chain",
    prod_titre: "Our producers",
    prod_sub: "The people who feed the house, from the nearest to the farthest.",
    vue_annuaire: "Directory",
    vue_carte: "Local map",
    ateliers_autour: "{n} workshops around {nom}. Tap a point for details.",
    carte_indispo: "Map unavailable.",
    maintenant: "Right now",
    atelier: "The workshop",
    langue: "Language",
  },
};

// ── Contexte React ──────────────────────────────────────────────────────
interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Traduit une clé d'INTERFACE. */
  tm: (cle: Cle) => string;
  /** Traduit un CONTENU localisé (repli fr). */
  tc: (texte: TexteLocalise | undefined) => string;
}

const CLE_STOCKAGE = "tabla-convive-lang";
const I18nContext = createContext<I18n | null>(null);

function langInitiale(): Lang {
  try {
    const v = localStorage.getItem(CLE_STOCKAGE);
    if (v && v in NOM_LANGUE) return v as Lang;
  } catch {
    /* stockage indisponible : on ignore */
  }
  return "fr";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(langInitiale);

  const value = useMemo<I18n>(() => {
    const setLang = (l: Lang) => {
      setLangState(l);
      try {
        localStorage.setItem(CLE_STOCKAGE, l);
      } catch {
        /* stockage indisponible : la langue s'applique pour la session */
      }
    };
    // Table des messages pour la langue courante (repli sur "en" puis "fr").
    const table = MESSAGES[lang === "en" ? "en" : "fr"];
    const tm = (cle: Cle) => table[cle] ?? MESSAGES.fr[cle] ?? cle;
    const tc = (texte: TexteLocalise | undefined) => t(texte, lang);
    return { lang, setLang, tm, tc };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Hook d'accès à l'i18n. À utiliser dans tout composant sous <LangProvider>. */
export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <LangProvider>");
  return ctx;
}
