/**
 * chrome/Topbar — barre du haut du back-office : fil d'Ariane + session.
 */
import { Bell, LogOut, Search } from "lucide-react";
import type { AuthUser } from "../auth";

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
    <div className="topbar">
      <div className="crumbs">
        <span>Maison Salice</span>
        <span className="sep">/</span>
        <span className="here">{title}</span>
      </div>
      <div className="row gap-2" style={{ marginLeft: "auto", alignItems: "center" }}>
        <button className="btn-icon" title="Recherche globale (⌘K)">
          <Search size={17} />
        </button>
        <button className="btn-icon" title="Notifications">
          <Bell size={17} />
        </button>
        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{user.email}</span>
        <button className="btn-icon" title="Se déconnecter" onClick={onLogout}>
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );
}
