/**
 * screens/Dashboard — tableau de bord d'engagement, au design du prototype.
 * Greeting + synthèse + KPI + courbe (taps/table) + plats les plus consultés.
 * Sur données réelles (/stats + /menu). Rafraîchi toutes les 5 s.
 */
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchMenu, fetchStats } from "../api";
import { BarsChart } from "../components/BarsChart";
import { Kpi } from "../components/Kpi";
import { useSlug } from "../session";

export function Dashboard() {
  const SLUG = useSlug();
  const { data: stats } = useQuery({
    queryKey: ["stats", SLUG],
    queryFn: () => fetchStats(SLUG),
    refetchInterval: 5000,
  });
  const { data: menu } = useQuery({ queryKey: ["menu", SLUG], queryFn: () => fetchMenu(SLUG) });

  const tablesActives = stats?.tapsParTable.length ?? 0;
  const barres = (stats?.tapsParTable ?? []).map((t) => ({ m: `T${t.libelle}`, v: t.taps }));
  const top5 = stats?.platsLesPlusVus.slice(0, 5) ?? [];

  const brief =
    stats && stats.totalTaps > 0
      ? `Ce soir : ${top5[0]?.nom.fr ?? "la carte"} en tête des consultations, ` +
        `${stats.totalTaps} arrivées et ${stats.totalVuesPlats} plats consultés ` +
        `sur ${tablesActives} table${tablesActives > 1 ? "s" : ""} active${tablesActives > 1 ? "s" : ""}.`
      : "Le service n'a pas encore généré d'engagement. Les chiffres apparaîtront dès les premiers taps.";

  return (
    <div className="content">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="t-page-title">Bonsoir, Claire.</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>
          Service en cours · {tablesActives} tables actives · Maison Salice
        </p>
      </div>

      {/* Synthèse */}
      <div
        style={{
          marginBottom: 24,
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          overflow: "hidden",
          background: "var(--white)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "16px 20px" }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--terracotta), var(--gold))",
              color: "var(--ivory)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={19} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, color: "var(--ink)", fontWeight: 600 }}>
              Votre point du service
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: "var(--ink)",
                lineHeight: 1.6,
                fontFamily: "var(--font-display)",
              }}
            >
              {brief}
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}
      >
        <Kpi label="Tables actives" value={tablesActives} suffix=" / 12" />
        <Kpi label="Plats consultés" value={stats?.totalVuesPlats ?? "…"} vs="ce service" />
        <Kpi label="Taps (arrivées)" value={stats?.totalTaps ?? "…"} vs="ce service" />
        <Kpi label="Plats à la carte" value={menu?.plats.length ?? "…"} vs="publiés" />
      </div>

      {/* Courbe + top plats */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 className="t-section-title">Activité de la soirée</h2>
          <div style={{ marginTop: 4, color: "var(--ink-mute)", fontSize: 13 }}>
            Taps NFC, par table
          </div>
          <div style={{ marginTop: 12 }}>
            <BarsChart data={barres} />
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="t-section-title">Plats les plus consultés</h2>
          <div style={{ marginTop: 4, marginBottom: 12, color: "var(--ink-mute)", fontSize: 13 }}>
            Ce service
          </div>
          {top5.length === 0 ? (
            <p style={{ color: "var(--ink-mute)", fontSize: 13 }}>Aucune consultation encore.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {top5.map((d, i) => (
                <div
                  key={d.nom.fr}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 48px",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 4px",
                    borderBottom: i < top5.length - 1 ? "1px solid var(--border-soft)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      color: "var(--gold)",
                      fontWeight: 500,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{d.nom.fr}</div>
                  <span className="t-mono" style={{ textAlign: "right", color: "var(--ink-soft)" }}>
                    {d.vues}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
