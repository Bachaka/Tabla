/**
 * components/StatusPill — pastille de statut au style du prototype (.pill).
 * Statut technique (base) → variante de pastille + libellé MAJUSCULE.
 */
import type { StatutPuce } from "../api";

export const STATUT: Record<StatutPuce, { kind: string; label: string }> = {
  appairee: { kind: "olive", label: "En service" },
  approvisionnee: { kind: "neutral", label: "Encodée" },
  defaillante: { kind: "terr", label: "À remplacer" },
  desactivee: { kind: "mute", label: "Réformée" },
};

export function StatusPill({ statut }: { statut: StatutPuce }) {
  const s = STATUT[statut] ?? { kind: "mute", label: statut };
  return <span className={`pill pill-${s.kind}`}>{s.label.toUpperCase()}</span>;
}
