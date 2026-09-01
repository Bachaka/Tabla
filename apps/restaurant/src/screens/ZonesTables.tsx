/**
 * screens/ZonesTables — gestion des tables et zones de salle (Restaurateur).
 *
 * Tables groupées par zone. On peut créer/modifier/supprimer une table, et
 * créer une zone. Règles côté serveur : label de table unique, suppression
 * refusée si une puce y est appairée (409).
 */
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTable,
  createZone,
  deleteTable,
  fetchTables,
  fetchZones,
  updateTable,
  type TableIn,
  type TableRow,
} from "../api";
import { useSlug } from "../session";

export function ZonesTables() {
  const SLUG = useSlug();
  const qc = useQueryClient();
  const tablesQuery = useQuery({ queryKey: ["tables", SLUG], queryFn: () => fetchTables(SLUG) });
  const zonesQuery = useQuery({ queryKey: ["zones", SLUG], queryFn: () => fetchZones(SLUG) });

  const tables = tablesQuery.data ?? [];
  const zones = zonesQuery.data ?? [];

  // Rafraîchit tables + zones après toute écriture.
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tables", SLUG] });
    qc.invalidateQueries({ queryKey: ["zones", SLUG] });
  };

  // ── État du formulaire « table » (tiroir) ────────────────────────────
  const [editing, setEditing] = useState<TableRow | "new" | null>(null);
  const [form, setForm] = useState<TableIn>({ libelle: "", zoneId: null });

  const createM = useMutation({
    mutationFn: (b: TableIn) => createTable(SLUG, b),
    onSuccess: () => { refresh(); setEditing(null); },
  });
  const updateM = useMutation({
    mutationFn: (v: { id: string; b: TableIn }) => updateTable(SLUG, v.id, v.b),
    onSuccess: () => { refresh(); setEditing(null); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteTable(SLUG, id),
    onSuccess: refresh,
  });

  const ouvrirNouvelle = () => {
    setForm({ libelle: "", zoneId: null });
    setEditing("new");
  };
  const ouvrirEdition = (t: TableRow) => {
    setForm({ libelle: t.libelle, zoneId: t.zoneId });
    setEditing(t);
  };
  const enregistrer = () => {
    if (editing === "new") createM.mutate(form);
    else if (editing) updateM.mutate({ id: editing.id, b: form });
  };
  const erreurForm = (createM.error ?? updateM.error) as Error | null;

  // ── État du formulaire « zone » ──────────────────────────────────────
  const [zoneOpen, setZoneOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const zoneM = useMutation({
    mutationFn: (name: string) => createZone(SLUG, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones", SLUG] });
      setZoneOpen(false);
      setZoneName("");
    },
  });

  // ── Groupement des tables par zone (+ « Sans zone ») ─────────────────
  const groupes: Array<{ id: string | null; name: string; tables: TableRow[] }> = [
    ...zones.map((z) => ({ id: z.id, name: z.nom, tables: tables.filter((t) => t.zoneId === z.id) })),
    { id: null, name: "Sans zone", tables: tables.filter((t) => t.zoneId === null) },
  ].filter((g) => g.tables.length > 0 || g.id !== null);

  const libres = tables.filter((t) => !t.occupee).length;

  return (
    <div className="content">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="t-page-title">Zones de tables</h1>
          <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>
            {tables.length} table{tables.length > 1 ? "s" : ""} · {zones.length} zone
            {zones.length > 1 ? "s" : ""} · {libres} libre{libres > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoneOpen(true)}>
            Nouvelle zone
          </button>
          <button className="btn btn-primary btn-sm" onClick={ouvrirNouvelle}>
            Nouvelle table
          </button>
        </div>
      </div>

      {tablesQuery.isLoading && <p className="t-mute">Chargement…</p>}

      {/* Erreur de suppression (ex. table avec une puce) */}
      {deleteM.isError && (
        <div className="card" style={{ padding: 12, marginBottom: 16, color: "var(--terracotta)", fontSize: 13 }}>
          {messageErreur((deleteM.error as Error).message)}
        </div>
      )}

      {/* Groupes par zone */}
      {groupes.map((g) => (
        <section key={g.id ?? "none"} style={{ marginBottom: 22 }}>
          <h2 className="t-section-title" style={{ marginBottom: 10 }}>
            {g.name} <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>· {g.tables.length}</span>
          </h2>
          {g.tables.length === 0 ? (
            <div className="card" style={{ padding: 16, color: "var(--ink-mute)", fontSize: 13 }}>
              Aucune table dans cette zone.
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {g.tables.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>Table {t.libelle}</span>
                    <span className={`tag ${t.occupee ? "tag-olive" : "tag-gold"}`}>
                      {t.occupee ? "Équipée" : "Libre"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => ouvrirEdition(t)}>
                      Modifier
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (confirm(`Supprimer la table ${t.libelle} ?`)) deleteM.mutate(t.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Tiroir : créer / modifier une table */}
      {editing !== null && (
        <Tiroir titre={editing === "new" ? "Nouvelle table" : "Modifier la table"} onClose={() => setEditing(null)}>
          <Champ label="Numéro / nom" value={form.libelle} onChange={(v) => setForm({ ...form, libelle: v })} />
          <label style={{ display: "block" }}>
            <span className="t-label" style={{ display: "block", marginBottom: 4 }}>Zone</span>
            <select
              className="input"
              value={form.zoneId ?? ""}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value === "" ? null : e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Sans zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </select>
          </label>

          {erreurForm && (
            <p style={{ color: "var(--terracotta)", fontSize: 13, marginTop: 12 }}>
              {messageErreur(erreurForm.message)}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-primary"
              onClick={enregistrer}
              disabled={form.libelle.trim() === "" || createM.isPending || updateM.isPending}
              style={{ flex: 1 }}
            >
              {editing === "new" ? "Créer" : "Enregistrer"}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>Annuler</button>
          </div>
        </Tiroir>
      )}

      {/* Tiroir : créer une zone */}
      {zoneOpen && (
        <Tiroir titre="Nouvelle zone" onClose={() => setZoneOpen(false)}>
          <Champ label="Nom de la zone" value={zoneName} onChange={setZoneName} />
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              className="btn btn-primary"
              onClick={() => zoneM.mutate(zoneName)}
              disabled={zoneName.trim() === "" || zoneM.isPending}
              style={{ flex: 1 }}
            >
              Créer
            </button>
            <button className="btn btn-secondary" onClick={() => setZoneOpen(false)}>Annuler</button>
          </div>
        </Tiroir>
      )}
    </div>
  );
}

/** Petit tiroir latéral réutilisable (overlay + panneau à droite). */
function Tiroir({ titre, onClose, children }: { titre: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <aside
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 380,
          overflowY: "auto",
          background: "var(--white)",
          borderLeft: "1px solid var(--border-soft)",
          padding: 24,
        }}
      >
        <h2 className="t-card-title" style={{ marginBottom: 18 }}>{titre}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
      </aside>
    </div>
  );
}

function Champ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block" }}>
      <span className="t-label" style={{ display: "block", marginBottom: 4 }}>{label}</span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%" }}
      />
    </label>
  );
}

function messageErreur(detail: string): string {
  if (detail === "label_deja_utilise") return "Ce numéro de table est déjà utilisé.";
  if (detail === "table_a_une_puce") return "Impossible : une puce est encore appairée à cette table.";
  if (detail === "unknown_zone") return "Zone inconnue.";
  return `Erreur : ${detail}`;
}
