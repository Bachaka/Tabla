/**
 * chrome/Sidebar — barre latérale de navigation (design du prototype).
 * Navigation groupée (Pilotage / Opérations / Supervision / Organisation),
 * icônes Lucide, compteurs. Seuls "dashboard" et "nfc" sont branchés ; le reste
 * ouvre un écran « à venir ».
 */
import type { ComponentType } from "react";
import {
  Activity, Box, CreditCard, Cpu, Download, FileText, Inbox, LayoutDashboard,
  Mail, RefreshCw, Settings, Shield, Star, Store, Tag, TrendingUp, Truck,
  UserPlus, Users, Zap,
} from "lucide-react";

type NavItem = {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  count?: string;
  tone?: "terr";
  group: string;
};

export const NAV: NavItem[] = [
  { key: "dashboard", label: "Vue d'ensemble", Icon: LayoutDashboard, group: "Pilotage" },
  { key: "restaurants", label: "Restaurants clients", Icon: Store, count: "1", group: "Opérations" },
  { key: "pipeline", label: "Pipeline commercial", Icon: TrendingUp, group: "Opérations" },
  { key: "nfc", label: "Parc NFC", Icon: Tag, count: "12", group: "Opérations" },
  { key: "ndef", label: "Contenu encodé", Icon: FileText, group: "Opérations" },
  { key: "provisioning", label: "Provisionnement", Icon: Cpu, group: "Opérations" },
  { key: "stock", label: "Stock & appro", Icon: Box, group: "Opérations" },
  { key: "logistics", label: "Logistique", Icon: Truck, group: "Opérations" },
  { key: "sav", label: "SAV & retours", Icon: RefreshCw, group: "Opérations" },
  { key: "onboarding", label: "Onboarding", Icon: UserPlus, group: "Opérations" },
  { key: "billing", label: "Abonnements & facturation", Icon: CreditCard, group: "Opérations" },
  { key: "fleet", label: "Santé du parc", Icon: Shield, group: "Supervision" },
  { key: "ai", label: "Prédictions IA", Icon: Zap, group: "Supervision" },
  { key: "security", label: "Sécurité NFC", Icon: Shield, group: "Supervision" },
  { key: "supplier", label: "Qualité fournisseur", Icon: Box, group: "Supervision" },
  { key: "alerts", label: "Centre d'alertes", Icon: Inbox, count: "3", tone: "terr", group: "Supervision" },
  { key: "reviews", label: "Avis & réputation", Icon: Star, group: "Supervision" },
  { key: "analytics", label: "Analytics globaux", Icon: TrendingUp, group: "Supervision" },
  { key: "taps", label: "Analyse des taps", Icon: Zap, group: "Supervision" },
  { key: "audit", label: "Activité & audit", Icon: Activity, group: "Supervision" },
  { key: "status", label: "Statut système", Icon: Activity, group: "Supervision" },
  { key: "team", label: "Équipe Lamiba", Icon: Users, group: "Organisation" },
  { key: "campaigns", label: "Campagnes", Icon: Mail, group: "Organisation" },
  { key: "settings", label: "Réglages", Icon: Settings, group: "Organisation" },
];

const GROUPS = ["Pilotage", "Opérations", "Supervision", "Organisation"];

export function navLabel(key: string): string {
  return NAV.find((i) => i.key === key)?.label ?? key;
}

export function Sidebar({
  current,
  onNav,
}: {
  current: string;
  onNav: (key: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <span className="sidebar-brand-mark">T</span>
          Tabla
        </div>
        <div className="sidebar-brand-sub">Administration</div>
      </div>
      <nav className="sidebar-nav">
        {GROUPS.map((g) => (
          <div key={g}>
            <div className="sidebar-section-label">{g}</div>
            {NAV.filter((i) => i.group === g).map((item) => (
              <div
                key={item.key}
                className={`sidebar-item ${current === item.key ? "active" : ""}`}
                onClick={() => onNav(item.key)}
              >
                <item.Icon size={15} />
                <span
                  style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {item.label}
                </span>
                {item.count && (
                  <span
                    className="sidebar-item-count"
                    style={
                      item.tone === "terr"
                        ? {
                            color: "var(--terracotta)",
                            background: "rgba(139, 58, 47, 0.10)",
                            borderRadius: 4,
                            padding: "0 5px",
                          }
                        : undefined
                    }
                  >
                    {item.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="sidebar-foot-avatar">CI</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-foot-name">Cissé Issiaka</div>
          <div className="sidebar-foot-role">Admin · Lamiba</div>
        </div>
      </div>
    </aside>
  );
}
