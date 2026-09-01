/**
 * features/producteurs/FicheProducteur — fiche producteur (sheet) au design du proto.
 * Hero portrait + histoire + saison + atelier.
 */
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../shared/i18n";
import type { Producteur } from "../../shared/menu/api";

export function FicheProducteur({
  producteur,
  onClose,
}: {
  producteur: Producteur;
  onClose: () => void;
}) {
  const { tm, tc } = useI18n();
  return (
    <>
      <div className="scrim open" onClick={onClose} />
      <div className="sheet open" role="dialog" aria-modal="true">
        <button className="sheet-back" onClick={onClose} aria-label="Fermer">
          <ArrowLeft size={18} />
        </button>
        <div className="producer-detail-hero">
          {producteur.urlPortrait && <img src={producteur.urlPortrait} alt="" />}
          <div className="producer-detail-overlay">
            <div className="role">{tc(producteur.role)}</div>
            <h2 className="serif">{producteur.prenom}</h2>
            <div className="workshop">
              {producteur.atelier} · {producteur.village}
            </div>
          </div>
        </div>
        <div className="producer-detail-body">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {producteur.labels.map((l) => (
              <span key={l} className="label-chip">
                {l}
              </span>
            ))}
            <span
              className="label-chip"
              style={{
                color: "var(--gold)",
                borderColor: "color-mix(in srgb, var(--gold) 35%, transparent)",
              }}
            >
              {producteur.km} km
            </span>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-soft)" }}>
            {tc(producteur.histoire)}
          </p>

          {producteur.saison.length > 0 && (
            <>
              <div className="section-label">{tm("maintenant")}</div>
              <div className="season-chips">
                {producteur.saison.map((s) => (
                  <span key={s} className="season-chip">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}

          {producteur.urlAtelier && (
            <>
              <div className="section-label">{tm("atelier")}</div>
              <div className="atelier-photo">
                <img src={producteur.urlAtelier} alt="" loading="lazy" />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
