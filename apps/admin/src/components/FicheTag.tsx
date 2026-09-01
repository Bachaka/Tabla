/**
 * components/FicheTag — fiche latérale d'une puce, au design du prototype
 * (side-panel + datalist). Champs réels + stat d'engagement (taps sur la table).
 */
import { useQuery } from "@tanstack/react-query";
import { Tag, X } from "lucide-react";
import { fetchTagDetail, type TagAdmin } from "../api";
import { StatusPill } from "./StatusPill";

function Data({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div className="datalist-key">{k}</div>
      <div className={`datalist-val ${mono ? "mono" : ""}`}>{v}</div>
    </div>
  );
}

export function FicheTag({ tag, onClose }: { tag: TagAdmin; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["tag", tag.id], queryFn: () => fetchTagDetail(tag.id) });

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <div className="side-panel">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(139, 58, 47, 0.08)",
                color: "var(--terracotta)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Tag size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="panel-header-id">{tag.uidCourt}</div>
              <div className="panel-header-sub">
                <span className="mono">{tag.uid}</span>
              </div>
            </div>
            <StatusPill statut={tag.statut} />
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section-title">Affectation</div>
            <div className="datalist">
              <Data k="UID complet" v={tag.uid} mono />
              <Data k="Restaurant" v={tag.nomRestaurant ?? "—"} />
              <Data k="Table" v={tag.libelleTable ?? "—"} mono />
              <Data k="Cible" v={tag.typeCible} />
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">Engagement</div>
            <div
              style={{
                borderRadius: 8,
                background: "var(--ivory)",
                border: "1px solid var(--border-soft)",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "var(--ink-mute)",
                }}
              >
                Taps sur cette table
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                  fontSize: 30,
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                {data ? data.tapsTable : "…"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
