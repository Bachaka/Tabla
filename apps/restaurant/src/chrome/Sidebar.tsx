/**
 * chrome/Sidebar — barre latérale du back-office (design du prototype).
 * Navigation groupée (Pilotage / Contenu / Relation convive / NFC / Maison).
 * Seul "dashboard" est branché ; le reste ouvre un écran « à venir ».
 */
const SECTIONS: Array<{ group: string; items: Array<{ id: string; label: string }> }> = [
  {
    group: "Pilotage",
    items: [
      { id: "dashboard", label: "Tableau de bord" },
      { id: "service", label: "Service en direct" },
      { id: "objectifs", label: "Objectifs & budget" },
      { id: "statistiques", label: "Statistiques" },
      { id: "rapports", label: "Rapports & exports" },
    ],
  },
  {
    group: "Contenu",
    items: [
      { id: "carte", label: "Carte" },
      { id: "menus", label: "Menus & formules" },
      { id: "stocks", label: "Stocks & disponibilité" },
      { id: "producteurs", label: "Producteurs" },
      { id: "avis", label: "Avis & retours" },
    ],
  },
  {
    group: "Relation convive",
    items: [
      { id: "convives", label: "Convives" },
      { id: "reservations", label: "Réservations" },
      { id: "fidelite", label: "Programme de fidélité" },
    ],
  },
  {
    group: "NFC",
    items: [
      { id: "nfc", label: "Puces NFC" },
      { id: "nfc-zones", label: "Zones de tables" },
      { id: "nfc-stats", label: "Statistiques NFC" },
    ],
  },
  {
    group: "Maison",
    items: [
      { id: "apparence", label: "Apparence" },
      { id: "equipe", label: "Équipe" },
      { id: "reglages", label: "Réglages" },
    ],
  },
];

export function sectionLabel(id: string): string {
  for (const s of SECTIONS) {
    const it = s.items.find((i) => i.id === id);
    if (it) return it.label;
  }
  return id;
}

export function Sidebar({
  active,
  onChange,
  tablesActives,
}: {
  active: string;
  onChange: (id: string) => void;
  tablesActives: number;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="name">Tabla</div>
        <div className="sub">Maison Salice</div>
      </div>
      <nav className="sidebar-nav">
        {SECTIONS.map((sec) => (
          <div key={sec.group}>
            <div className="nav-section-label t-label">{sec.group}</div>
            {sec.items.map((it) => (
              <div
                key={it.id}
                className={"nav-item " + (active === it.id ? "active" : "")}
                onClick={() => onChange(it.id)}
              >
                {it.label}
              </div>
            ))}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 14px 8px" }}>
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border-soft)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div className="t-label" style={{ marginBottom: 6 }}>
              Service en cours
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "var(--olive)",
                  boxShadow: "0 0 0 3px rgba(74,103,65,0.15)",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--ink)" }}>
                {tablesActives} tables actives
              </span>
            </div>
          </div>
        </div>
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">CL</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>Claire Lefèvre</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>Gérante</div>
        </div>
      </div>
    </aside>
  );
}
