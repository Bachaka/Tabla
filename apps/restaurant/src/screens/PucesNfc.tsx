/**
 * screens/PucesNfc — appairage des puces aux tables (back-office Restaurateur).
 *
 *   • « À poser »   : puces reçues (provisioned) → menu des tables LIBRES + Appairer
 *   • « En service » : puces posées (paired) → Désappairer
 * Une mutation `pairTag` fait la bascule provisioned↔paired ; on rafraîchit
 * ensuite les puces ET les tables (une table devient libre/occupée).
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTables, fetchTags, pairTag, type TableRow, type TagRow } from "../api";
import { useSlug } from "../session";

export function PucesNfc() {
  const SLUG = useSlug();
  const qc = useQueryClient();
  const tagsQuery = useQuery({ queryKey: ["tags", SLUG], queryFn: () => fetchTags(SLUG) });
  const tablesQuery = useQuery({ queryKey: ["tables", SLUG], queryFn: () => fetchTables(SLUG) });

  // La mutation : { id, tableId }. tableId=null → désappairer.
  const pairM = useMutation({
    mutationFn: (v: { id: string; tableId: string | null }) => pairTag(SLUG, v.id, v.tableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags", SLUG] });
      qc.invalidateQueries({ queryKey: ["tables", SLUG] });
    },
  });

  const tags = tagsQuery.data ?? [];
  const tables = tablesQuery.data ?? [];

  const aPoser = tags.filter((t) => t.statut === "approvisionnee");
  const enService = tags.filter((t) => t.statut === "appairee");
  const tablesLibres = tables.filter((t) => !t.occupee);

  // Applique l'action ; l'id en cours sert à ne désactiver QUE la ligne visée.
  const enCours = pairM.isPending ? pairM.variables?.id : undefined;
  const appairer = (id: string, tableId: string | null) => pairM.mutate({ id, tableId });

  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h1 className="t-page-title">Puces NFC</h1>
        <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>
          {enService.length} en service · {aPoser.length} à poser · {tablesLibres.length} table
          {tablesLibres.length > 1 ? "s" : ""} libre{tablesLibres.length > 1 ? "s" : ""}
        </p>
      </div>

      {tagsQuery.isLoading && <p className="t-mute">Chargement…</p>}
      {tagsQuery.error != null && <p style={{ color: "var(--terracotta)" }}>Parc indisponible.</p>}

      {/* Bandeau d'erreur d'appairage (ex. table déjà occupée) */}
      {pairM.isError && (
        <div
          className="card"
          style={{ padding: 12, marginBottom: 16, color: "var(--terracotta)", fontSize: 13 }}
        >
          {messageErreur((pairM.error as Error).message)}
        </div>
      )}

      {/* Section « À poser » */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="t-section-title" style={{ marginBottom: 10 }}>
          À poser
        </h2>
        {aPoser.length === 0 ? (
          <div className="card" style={{ padding: 18, color: "var(--ink-mute)", fontSize: 13 }}>
            Aucune puce à poser. Créez un lot depuis la console Admin pour recevoir des puces.
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {aPoser.map((t) => (
              <LignePuce
                key={t.id}
                tag={t}
                tablesLibres={tablesLibres}
                busy={enCours === t.id}
                onPair={appairer}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section « En service » */}
      <section>
        <h2 className="t-section-title" style={{ marginBottom: 10 }}>
          En service
        </h2>
        {enService.length === 0 ? (
          <div className="card" style={{ padding: 18, color: "var(--ink-mute)", fontSize: 13 }}>
            Aucune puce en service.
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {enService.map((t) => (
              <LignePuce
                key={t.id}
                tag={t}
                tablesLibres={tablesLibres}
                busy={enCours === t.id}
                onPair={appairer}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LignePuce({
  tag,
  tablesLibres,
  busy,
  onPair,
}: {
  tag: TagRow;
  tablesLibres: TableRow[];
  busy: boolean;
  onPair: (id: string, tableId: string | null) => void;
}) {
  const estPosee = tag.statut === "appairee";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 18px",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="t-mono" style={{ fontWeight: 500 }}>
          {tag.uidCourt}
        </span>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>
          {tag.uid}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {estPosee ? (
          <>
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Table <strong>{tag.libelleTable}</strong>
            </span>
            <span className="tag tag-olive">En service</span>
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onPair(tag.id, null)}>
              {busy ? "…" : "Désappairer"}
            </button>
          </>
        ) : (
          <ControlesAppairage tag={tag} tablesLibres={tablesLibres} busy={busy} onPair={onPair} />
        )}
      </div>
    </div>
  );
}

/** Menu des tables libres + bouton Appairer (pour une puce à poser). */
function ControlesAppairage({
  tag,
  tablesLibres,
  busy,
  onPair,
}: {
  tag: TagRow;
  tablesLibres: TableRow[];
  busy: boolean;
  onPair: (id: string, tableId: string | null) => void;
}) {
  // Sélection locale : par défaut la 1re table libre (dérivée, pas besoin d'effet).
  const [choix, setChoix] = useState("");
  const tableSel = choix !== "" ? choix : (tablesLibres[0]?.id ?? "");

  if (tablesLibres.length === 0) {
    return (
      <>
        <span className="tag tag-gold">À poser</span>
        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Aucune table libre</span>
      </>
    );
  }

  return (
    <>
      <span className="tag tag-gold">À poser</span>
      <select
        className="input"
        value={tableSel}
        onChange={(e) => setChoix(e.target.value)}
        style={{ width: 130, padding: "6px 8px" }}
      >
        {tablesLibres.map((t) => (
          <option key={t.id} value={t.id}>
            Table {t.libelle}
          </option>
        ))}
      </select>
      <button
        className="btn btn-primary btn-sm"
        disabled={busy || tableSel === ""}
        onClick={() => onPair(tag.id, tableSel)}
      >
        {busy ? "…" : "Appairer"}
      </button>
    </>
  );
}

function messageErreur(detail: string): string {
  if (detail === "table_occupee") return "Cette table a déjà une puce en service.";
  if (detail === "unknown_table") return "Table inconnue.";
  if (detail === "unknown_tag") return "Puce inconnue.";
  return `Échec de l'appairage : ${detail}`;
}
