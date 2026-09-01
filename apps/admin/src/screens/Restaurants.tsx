/**
 * screens/Restaurants — CRM « Restaurants clients » (F-CRM).
 * Table dense (design proto) + création/édition (panneau) + suppression.
 * Écritures via mutations React Query (la liste se rafraîchit après chaque op).
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import {
  createRestaurant,
  deleteRestaurant,
  fetchRestaurants,
  type RestaurantIn,
  type RestaurantRow,
  updateRestaurant,
} from "../api";
import { BillingPill, HealthScore, PlanPill } from "../components/crm";
import { RestoAvatar } from "../components/RestoAvatar";

const VIDE: RestaurantIn = {
  nom: "",
  slug: "",
  ville: "",
  forfait: "Essentiel",
  scoreSante: 75,
  mrr: 0,
  statutFacturation: "trialing",
  note: null,
};

export function Restaurants() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["restaurants"], queryFn: fetchRestaurants });

  // `editing` : null (fermé) | "new" (création) | un id (édition).
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantIn>(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);

  const fermer = () => {
    setEditing(null);
    setErreur(null);
  };
  const invalider = () => qc.invalidateQueries({ queryKey: ["restaurants"] });

  const createM = useMutation({
    mutationFn: createRestaurant,
    onSuccess: () => {
      invalider();
      fermer();
    },
    onError: (e: Error) => setErreur(messageErreur(e.message)),
  });
  const updateM = useMutation({
    mutationFn: (v: { id: string; body: RestaurantIn }) => updateRestaurant(v.id, v.body),
    onSuccess: () => {
      invalider();
      fermer();
    },
    onError: (e: Error) => setErreur(messageErreur(e.message)),
  });
  const deleteM = useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      invalider();
      fermer();
    },
    onError: (e: Error) => setErreur(messageErreur(e.message)),
  });

  const ouvrirNouveau = () => {
    setForm(VIDE);
    setErreur(null);
    setEditing("new");
  };
  const ouvrirEdition = (r: RestaurantRow) => {
    setForm({
      nom: r.nom,
      slug: r.slug,
      ville: r.ville,
      forfait: r.forfait,
      scoreSante: r.scoreSante,
      mrr: r.mrr,
      statutFacturation: r.statutFacturation,
      note: r.note,
    });
    setErreur(null);
    setEditing(r.id);
  };

  const enregistrer = () => {
    if (editing === "new") createM.mutate(form);
    else if (editing) updateM.mutate({ id: editing, body: form });
  };

  const restos = data ?? [];
  const mrrTotal = restos.reduce((s, r) => s + r.mrr, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Restaurants clients</h1>
          <p className="page-subtitle">
            <span className="meta-chip">
              <span className="meta-num">{restos.length}</span> restaurants
            </span>
            <span className="meta-chip">
              <span className="meta-num">{mrrTotal.toLocaleString("fr-FR")} €</span> MRR total
            </span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={ouvrirNouveau}>
          <Plus size={14} />
          Nouveau
        </button>
      </div>

      {isLoading && <p style={{ color: "var(--ink-mute)", fontSize: 13 }}>Chargement…</p>}

      {data && (
        <section className="overflow-hidden rounded-lg border border-white/10 bg-cream">
          <table className="t">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Ville</th>
                <th>Forfait</th>
                <th>Tags</th>
                <th>Health</th>
                <th>MRR</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {restos.map((r) => (
                <tr key={r.id} onClick={() => ouvrirEdition(r)} style={{ cursor: "pointer" }}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <RestoAvatar name={r.nom} />
                      {r.nom}
                    </span>
                  </td>
                  <td style={{ color: "var(--ink-soft)" }}>{r.ville}</td>
                  <td>
                    <PlanPill plan={r.forfait} />
                  </td>
                  <td className="mono">{r.tags}</td>
                  <td>
                    <HealthScore value={r.scoreSante} />
                  </td>
                  <td className="mono">{r.mrr.toLocaleString("fr-FR")} €</td>
                  <td>
                    <BillingPill status={r.statutFacturation} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      title="Supprimer"
                      onClick={() => {
                        if (confirm(`Supprimer « ${r.nom} » ?`)) deleteM.mutate(r.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={fermer} />
          <aside className="absolute inset-y-0 right-0 w-[420px] overflow-y-auto border-l border-white/10 bg-cream p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-medium text-ink">
                {editing === "new" ? "Nouveau restaurant" : "Modifier"}
              </h2>
              <button className="icon-btn" onClick={fermer}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Champ label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
              <Champ label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
              <Champ label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} />
              <Select
                label="Forfait"
                value={form.forfait}
                options={["Essentiel", "Pro", "Enterprise"]}
                onChange={(v) => setForm({ ...form, forfait: v })}
              />
              <Select
                label="Facturation"
                value={form.statutFacturation}
                options={["trialing", "active", "past_due", "at_risk"]}
                onChange={(v) => setForm({ ...form, statutFacturation: v })}
              />
              <ChampNum
                label="Health score (0–100)"
                value={form.scoreSante}
                onChange={(v) => setForm({ ...form, scoreSante: v })}
              />
              <ChampNum label="MRR (€/mois)" value={form.mrr} onChange={(v) => setForm({ ...form, mrr: v })} />
            </div>

            {erreur && (
              <p style={{ color: "var(--terracotta)", fontSize: 13, marginTop: 14 }}>{erreur}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={enregistrer} style={{ flex: 1 }}>
                {editing === "new" ? "Créer" : "Enregistrer"}
              </button>
              <button className="btn btn-secondary" onClick={fermer}>
                Annuler
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function messageErreur(detail: string): string {
  if (detail === "slug_deja_utilise") return "Ce slug est déjà utilisé.";
  if (detail === "restaurant_non_vide")
    return "Impossible de supprimer : ce restaurant a des puces, tables ou plats liés.";
  return detail;
}

function Champ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
        {label}
      </span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%" }}
      />
    </label>
  );
}

function ChampNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
        {label}
      </span>
      <input
        className="input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
        {label}
      </span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
