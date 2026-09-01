/**
 * theme.ts — gestion du thème clair / sombre de la console Admin.
 *
 * Le style est entièrement piloté par des variables CSS (voir proto.css) :
 *   :root                 → palette CLAIRE (valeurs par défaut)
 *   [data-theme="dark"]   → surcharge SOMBRE
 * Basculer le thème revient donc à changer UN attribut sur <html> :
 *   data-theme="dark"  → sombre     |     data-theme="light" → clair
 * (« light » ne correspond à aucune surcharge, donc :root — la palette claire —
 * s'applique.) Le choix est mémorisé dans localStorage pour être conservé d'une
 * visite à l'autre.
 */

export type Theme = "dark" | "light";

const CLE = "tabla-admin-theme"; // clé de stockage local
const DEFAUT: Theme = "dark"; // sombre par défaut (identité visuelle de l'Admin)

/** Lit le thème mémorisé ; retombe sur le défaut si rien / stockage indispo. */
export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(CLE);
    return v === "light" || v === "dark" ? v : DEFAUT;
  } catch {
    // localStorage peut lever (navigation privée stricte) : on ne casse pas.
    return DEFAUT;
  }
}

/** Applique le thème au document (attribut sur <html>), sans persister. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Applique ET mémorise le thème choisi. */
export function setTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(CLE, theme);
  } catch {
    // Stockage indisponible : le thème s'applique quand même pour la session.
  }
}
