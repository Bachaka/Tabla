/**
 * chrome/ThemeToggle — bouton de bascule clair / sombre (dans la Topbar).
 *
 * Composant autonome : il tient son propre état (le thème courant), initialisé
 * depuis le choix mémorisé. Au clic, il bascule, applique le nouveau thème au
 * document et le mémorise (setTheme). L'icône indique l'action possible :
 *   - en sombre → un soleil (« passer en clair ») ;
 *   - en clair  → une lune  (« passer en sombre »).
 */
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { getStoredTheme, setTheme, type Theme } from "../theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const basculer = () => {
    const suivant: Theme = theme === "dark" ? "light" : "dark";
    setTheme(suivant); // <html data-theme=…> + localStorage
    setThemeState(suivant); // re-render du bouton (icône/libellé)
  };

  const clair = theme === "light";
  return (
    <button
      className="icon-btn"
      onClick={basculer}
      title={clair ? "Passer en mode sombre" : "Passer en mode clair"}
      aria-label="Basculer le thème clair / sombre"
    >
      {clair ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
