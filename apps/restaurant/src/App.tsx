/**
 * Back-office Restaurateur — coquille au design du prototype.
 * Barrière d'auth : pas de session → <Login/>. Une fois connecté, le slug du
 * restaurant est diffusé aux écrans via SlugContext.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "./api";
import { clearToken, fetchMe, getToken, logout, type AuthUser } from "./auth";
import { sectionLabel, Sidebar } from "./chrome/Sidebar";
import { Topbar } from "./chrome/Topbar";
import { Dashboard } from "./screens/Dashboard";
import { Login } from "./screens/Login";
import { Placeholder } from "./screens/Placeholder";
import { PucesNfc } from "./screens/PucesNfc";
import { ZonesTables } from "./screens/ZonesTables";
import { SlugContext, useSlug } from "./session";

export default function App() {
  // undefined = en cours de vérification ; null = déconnecté ; objet = connecté.
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      });
  }, []);

  if (user === undefined) {
    return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement…</div>;
  }
  if (user === null) {
    return <Login onLogin={setUser} />;
  }

  return (
    <SlugContext.Provider value={user.restaurantSlug ?? ""}>
      <Shell
        user={user}
        onLogout={() => {
          logout();
          setUser(null);
        }}
      />
    </SlugContext.Provider>
  );
}

/** La coquille (sidebar + topbar + écran), rendue une fois connecté. */
function Shell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [screen, setScreen] = useState("dashboard");
  const slug = useSlug();

  const { data: stats } = useQuery({
    queryKey: ["stats", slug],
    queryFn: () => fetchStats(slug),
    refetchInterval: 5000,
    enabled: slug !== "",
  });
  const tablesActives = stats?.tapsParTable.length ?? 0;

  return (
    <div className="app">
      <Sidebar active={screen} onChange={setScreen} tablesActives={tablesActives} />
      <main className="main">
        <Topbar title={sectionLabel(screen)} user={user} onLogout={onLogout} />
        {screen === "dashboard" ? (
          <Dashboard />
        ) : screen === "nfc" ? (
          <PucesNfc />
        ) : screen === "nfc-zones" ? (
          <ZonesTables />
        ) : (
          <Placeholder label={sectionLabel(screen)} />
        )}
      </main>
    </div>
  );
}
