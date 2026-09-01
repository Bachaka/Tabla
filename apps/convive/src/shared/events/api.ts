/**
 * shared/events — enregistrement d'événements d'engagement.
 * « Fire-and-forget » : on n'attend pas la réponse et on ignore les erreurs
 * (mesurer ne doit jamais bloquer ni casser l'expérience du convive).
 */
import { API_BASE } from "../../apiBase";

export function recordEvent(
  slug: string,
  type: "vue_plat" | "vue_producteur",
  sujetId: string | null,
  tableId: string | null,
): void {
  fetch(`${API_BASE}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, type, sujetId, tableId }),
  }).catch(() => {});
}
