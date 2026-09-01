/**
 * chrome/Topbar — barre du haut : fil d'Ariane + recherche ⌘K + session.
 */
import { Bell, HelpCircle, LogOut, Search } from "lucide-react";
import type { AuthUser } from "../auth";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({
  title,
  user,
  onLogout,
}: {
  title: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Tabla</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{title}</span>
      </div>
      <div className="global-search" style={{ cursor: "default" }}>
        <span className="global-search-icon">
          <Search size={14} />
        </span>
        <input placeholder="Rechercher un tag, un restaurant…" readOnly />
        <span className="global-search-kbd">⌘K</span>
      </div>
      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        <button className="icon-btn" title="Aide">
          <HelpCircle size={15} />
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={15} />
        </button>
        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{user.email}</span>
        <button className="icon-btn" title="Se déconnecter" onClick={onLogout}>
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
