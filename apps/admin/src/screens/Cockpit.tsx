/**
 * screens/Cockpit — vue d'ensemble au design du prototype.
 * KPI (.kpi) + courbe « taps par table » (BarsChart) + alertes dérivées +
 * restaurants supervisés. Sur données réelles (overview + stats).
 */
import { useQuery } from "@tanstack/react-query";
import { fetchOverview, fetchStats } from "../api";
import { BarsChart } from "../components/BarsChart";
import { Kpi } from "../components/Kpi";
import { RestoAvatar } from "../components/RestoAvatar";

export function Cockpit() {
  const { data: ov } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    refetchInterval: 5000,
  });
  const { data: stats } = useQuery({
    queryKey: ["stats", "maison-salice"],
    queryFn: () => fetchStats("maison-salice"),
    refetchInterval: 5000,
  });

  const barres = (stats?.tapsParTable ?? []).map((t) => ({ m: `T${t.libelle}`, v: t.taps }));

  // Alertes dérivées des vraies données.
  const alertes: Array<{ dot: string; text: string; meta: string }> = [];
  if (ov && stats) {
    const sansTap = ov.nbTables - stats.tapsParTable.length;
    if (sansTap > 0)
      alertes.push({
        dot: "var(--amber)",
        text: `${sansTap} tables sans tap enregistré`,
        meta: "Engagement",
      });
  }
  alertes.push({ dot: "var(--olive)", text: "Tous les services opérationnels", meta: "Système" });
  if (ov)
    alertes.push({
      dot: "var(--ink-mute)",
      text: `${ov.totalEvenements} événements captés`,
      meta: "Analytics",
    });

  return (
    <div className="page">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            margin: 0,
            color: "var(--ink)",
          }}
        >
          Bonsoir, Cissé.
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 6,
            fontSize: 12,
            color: "var(--ink-soft)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: "var(--olive)",
                boxShadow: "0 0 0 3px rgba(74, 103, 65, 0.14)",
              }}
            />
            Tous services opérationnels
          </span>
          <span style={{ color: "var(--ink-mute)" }}>·</span>
          <span className="mono" style={{ fontSize: 11 }}>
            tabla-api · eu-west-3
          </span>
        </div>
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Kpi label="Restaurants" value={ov?.nbRestaurants ?? "…"} foot="supervisés" />
        <Kpi label="Puces NFC" value={ov?.nbPuces ?? "…"} foot="dans le parc" />
        <Kpi label="Tables" value={ov?.nbTables ?? "…"} foot="équipées" />
        <Kpi label="Taps" value={ov?.totalTaps ?? "…"} foot="arrivées" />
        <Kpi label="Événements" value={ov?.totalEvenements ?? "…"} foot="captés" />
      </div>

      {/* Courbe + alertes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Engagement — taps par table</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                Maison Salice · temps réel
              </div>
            </div>
          </div>
          <div className="card-padded">
            <BarsChart data={barres} />
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div className="card-title">Alertes en cours</div>
          </div>
          <div style={{ flex: 1 }}>
            {alertes.map((a, i) => (
              <div className="alert-row" key={i}>
                <span
                  style={{ width: 7, height: 7, borderRadius: 99, background: a.dot, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div className="alert-text">{a.text}</div>
                  <div className="alert-meta">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurants supervisés */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Restaurants supervisés</div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>
            {ov?.restaurants.length ?? 0}
          </span>
        </div>
        <table className="t">
          <thead>
            <tr>
              <th>Établissement</th>
              <th>Ville</th>
              <th style={{ textAlign: "right" }}>Taps</th>
            </tr>
          </thead>
          <tbody>
            {(ov?.restaurants ?? []).map((r) => (
              <tr key={r.slug}>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <RestoAvatar name={r.nom} />
                    {r.nom}
                  </span>
                </td>
                <td style={{ color: "var(--ink-soft)" }}>{r.ville}</td>
                <td style={{ textAlign: "right" }}>
                  <span className="mono">{r.taps}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
