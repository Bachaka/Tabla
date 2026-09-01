/**
 * screens/ParcNfc — inventaire du parc NFC, au design du prototype.
 * Table dense (classes .t du proto) + filtres + fiche latérale. Données réelles.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, X } from "lucide-react";
import {
  createLot,
  fetchRestaurants,
  fetchTags,
  type TagAdmin,
  type StatutPuce,
} from "../api";
import { FicheTag } from "../components/FicheTag";
import { RestoAvatar } from "../components/RestoAvatar";
import { StatusPill } from "../components/StatusPill";

const FILTRES: Array<{ key: StatutPuce | "all"; label: string; color?: string }> = [
  { key: "all", label: "Toutes" },
  { key: "appairee", label: "En service", color: "var(--olive)" },
  { key: "approvisionnee", label: "Encodée" },
  { key: "defaillante", label: "À remplacer", color: "var(--terracotta)" },
  { key: "desactivee", label: "Réformée" },
];

export function ParcNfc() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });
  const [filtre, setFiltre] = useState<StatutPuce | "all">("all");
  const [recherche, setRecherche] = useState("");
  const [openTag, setOpenTag] = useState<TagAdmin | null>(null);

  // ── Création de lot ──────────────────────────────────────────────────
  const restosQuery = useQuery({ queryKey: ["restaurants"], queryFn: fetchRestaurants });
  const [lotOpen, setLotOpen] = useState(false);
  const [lotResto, setLotResto] = useState("");
  const [lotQty, setLotQty] = useState(20);

  const lotM = useMutation({
    mutationFn: () => createLot(lotResto, lotQty),
    onSuccess: (creees) => {
      // Rafraîchit la liste du parc (et les compteurs des restaurants).
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      setLotOpen(false);
      // eslint-disable-next-line no-alert
      alert(`${creees.length} puce(s) créée(s).`);
    },
  });

  function ouvrirLot() {
    // Pré-sélectionne le 1er restaurant si aucun choisi.
    if (lotResto === "" && restosQuery.data && restosQuery.data.length > 0) {
      setLotResto(restosQuery.data[0]!.id);
    }
    setLotOpen(true);
  }

  const tags = data ?? [];
  const compteurs = useMemo(() => {
    const c: Record<string, number> = { all: tags.length };
    for (const t of tags) c[t.statut] = (c[t.statut] ?? 0) + 1;
    return c;
  }, [tags]);

  const q = recherche.toLowerCase();
  const visibles = tags.filter(
    (t) =>
      (filtre === "all" || t.statut === filtre) &&
      (q === "" || t.uid.toLowerCase().includes(q) || t.uidCourt.toLowerCase().includes(q)),
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parc NFC</h1>
          <p className="page-subtitle">
            <span className="meta-chip">
              <span className="meta-num">{compteurs.all}</span> tags
            </span>
            <span className="meta-chip">
              <span className="meta-num" style={{ color: "var(--olive)" }}>
                {compteurs.appairee ?? 0}
              </span>{" "}
              en service
            </span>
            <span className="meta-chip">
              <span className="meta-num" style={{ color: "var(--terracotta)" }}>
                {compteurs.defaillante ?? 0}
              </span>{" "}
              à remplacer
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary">
            <Download size={14} />
            Exporter
          </button>
          <button className="btn btn-primary" onClick={ouvrirLot}>
            <Plus size={14} />
            Nouveau lot
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filterbar">
        <div className="filter-input search">
          <Search size={13} style={{ color: "var(--ink-mute)" }} />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="UID ou short_uid…"
          />
        </div>
        {FILTRES.map((f) => (
          <button
            key={f.key}
            className={`filter-input ${filtre === f.key ? "active" : ""}`}
            onClick={() => setFiltre(f.key)}
          >
            {f.color && (
              <span
                style={{ width: 6, height: 6, borderRadius: 99, background: f.color }}
              />
            )}
            <span>{f.label}</span>
            <span className="filter-count">{compteurs[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: "var(--ink-mute)", fontSize: 13 }}>Chargement…</p>}
      {error != null && <p style={{ color: "var(--terracotta)", fontSize: 13 }}>Parc indisponible.</p>}

      {data && (
        <div className="t-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Short UID</th>
                <th>UID NFC</th>
                <th>Statut</th>
                <th>Restaurant</th>
                <th>Table</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((t) => (
                <tr key={t.id} onClick={() => setOpenTag(t)}>
                  <td>
                    <span className="mono" style={{ fontWeight: 500 }}>
                      {t.uidCourt}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
                      {t.uid}
                    </span>
                  </td>
                  <td>
                    <StatusPill statut={t.statut} />
                  </td>
                  <td>
                    {t.nomRestaurant ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}
                      >
                        <RestoAvatar name={t.nomRestaurant} />
                        <span>{t.nomRestaurant}</span>
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-mute)" }}>—</span>
                    )}
                  </td>
                  <td>
                    {t.libelleTable ? (
                      <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {t.libelleTable}
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-mute)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--ink-mute)",
                      }}
                    >
                      {t.typeCible}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="t-footer">
            <span>
              <span className="mono tabular" style={{ color: "var(--ink)" }}>
                {visibles.length}
              </span>
              <span className="muted"> résultats</span>
            </span>
            <div className="t-footer-actions">
              <span className="page-num">1–{visibles.length} sur {visibles.length}</span>
            </div>
          </div>
        </div>
      )}

      {openTag && <FicheTag tag={openTag} onClose={() => setOpenTag(null)} />}

      {/* Tiroir : création d'un lot de puces */}
      {lotOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLotOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[420px] overflow-y-auto border-l border-white/10 bg-cream p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-medium text-ink">Nouveau lot</h2>
              <button className="icon-btn" onClick={() => setLotOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "block" }}>
                <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
                  Restaurant client
                </span>
                <select
                  className="input"
                  value={lotResto}
                  onChange={(e) => setLotResto(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {(restosQuery.data ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "block" }}>
                <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
                  Quantité (1–200)
                </span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={200}
                  value={lotQty}
                  onChange={(e) => setLotQty(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <p style={{ color: "var(--ink-mute)", fontSize: 12 }}>
                Les puces sont créées au statut <strong>« Encodée »</strong> (provisioned),
                rattachées au restaurant, sans table (à appairer ensuite).
              </p>
            </div>

            {lotM.isError && (
              <p style={{ color: "var(--terracotta)", fontSize: 13, marginTop: 14 }}>
                {(lotM.error as Error).message}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={() => lotM.mutate()}
                disabled={lotResto === "" || lotQty < 1 || lotM.isPending}
                style={{ flex: 1 }}
              >
                {lotM.isPending ? "Création…" : `Créer ${lotQty} puce(s)`}
              </button>
              <button className="btn btn-secondary" onClick={() => setLotOpen(false)}>
                Annuler
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
