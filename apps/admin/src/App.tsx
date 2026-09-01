/**
 * Console Admin — coquille au design du prototype : sidebar + topbar + écran.
 * Barrière d'auth : tant qu'on n'a pas de session valide, on affiche <Login/>.
 */
import { useEffect, useState } from "react";
import { clearToken, fetchMe, getToken, logout, type AuthUser } from "./auth";
import { navLabel, Sidebar } from "./chrome/Sidebar";
import { Topbar } from "./chrome/Topbar";
import { Cockpit } from "./screens/Cockpit";
import { Login } from "./screens/Login";
import { ParcNfc } from "./screens/ParcNfc";
import { Placeholder } from "./screens/Placeholder";
import { Restaurants } from "./screens/Restaurants";

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  // undefined = en cours de vérification ; null = déconnecté ; objet = connecté.
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  // Au démarrage : si un token existe, on le valide via /auth/me.
  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken(); // token expiré/invalide → on nettoie
        setUser(null);
      });
  }, []);

  if (user === undefined) {
    return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement…</div>;
  }
  if (user === null) {
    return <Login onLogin={setUser} />;
  }

  const seDeconnecter = () => {
    logout();
    setUser(null);
  };

  const contenu =
    screen === "dashboard" ? (
      <Cockpit />
    ) : screen === "nfc" ? (
      <ParcNfc />
    ) : screen === "restaurants" ? (
      <Restaurants />
    ) : (
      <Placeholder label={navLabel(screen)} />
    );

  return (
    <div className="app-root">
      <Sidebar current={screen} onNav={setScreen} />
      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar title={navLabel(screen)} user={user} onLogout={seDeconnecter} />
        {contenu}
      </main>
    </div>
  );
}
