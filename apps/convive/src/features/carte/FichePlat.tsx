/**
 * features/carte/FichePlat — fiche plat (sheet) au design du prototype.
 * Hero + description + composition (lien producteur) + allergènes + lecture audio.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Square, Volume2 } from "lucide-react";
import { useI18n, type Cle } from "../../shared/i18n";
import type { Plat, Producteur } from "../../shared/menu/api";

// Code de langue → locale BCP-47 pour la synthèse vocale (Web Speech).
const LOCALE_TTS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
};

export function FichePlat({
  plat,
  producteurs,
  onClose,
}: {
  plat: Plat;
  producteurs: Producteur[];
  onClose: () => void;
}) {
  const { lang, tm, tc } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const ttsOk = typeof window !== "undefined" && "speechSynthesis" in window;

  // Nom du producteur d'un ingrédient (pour la composition).
  const prod = (id: string | null) =>
    id ? producteurs.find((p) => p.id === id) ?? null : null;

  // Arrête la lecture à la fermeture.
  useEffect(() => {
    return () => {
      if (ttsOk) window.speechSynthesis.cancel();
    };
  }, [ttsOk]);

  const toggleSpeak = () => {
    if (!ttsOk) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const parts = [tc(plat.nom), tc(plat.description)];
    if (plat.allergenes.length) parts.push(tm("allergenes") + " : " + plat.allergenes.join(", "));
    const u = new SpeechSynthesisUtterance(parts.join(". "));
    u.lang = LOCALE_TTS[lang] ?? "fr-FR";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  return (
    <>
      <div className="scrim open" onClick={onClose} />
      <div className="sheet open" role="dialog" aria-modal="true">
        <button className="sheet-back" onClick={onClose} aria-label="Fermer">
          <ArrowLeft size={18} />
        </button>
        <div className="dish-hero">{plat.urlPhoto && <img src={plat.urlPhoto} alt="" />}</div>
        <div className="dish-body">
          <div className="dish-header">
            <h1 className="serif dish-title">{tc(plat.nom)}</h1>
            <div className="dish-price-large">{Number(plat.prix)} €</div>
          </div>
          <div className="dish-cat-line">
            <span className="caps">{tm(`cat_${plat.categorie}` as Cle)}</span>
            {plat.signature && (
              <span
                style={{
                  color: "var(--gold)",
                  fontFamily: "Fraunces, serif",
                  fontStyle: "italic",
                  fontSize: 13,
                }}
              >
                · {tm("signature_maison")}
              </span>
            )}
          </div>

          {ttsOk && (
            <button className={`dish-listen${speaking ? " on" : ""}`} onClick={toggleSpeak}>
              {speaking ? <Square size={15} /> : <Volume2 size={16} />}
              {speaking ? tm("arreter") : tm("ecouter")}
            </button>
          )}

          <p className="dish-long">{tc(plat.description)}</p>

          {plat.composition.length > 0 && (
            <>
              <div className="section-label">{tm("composition")}</div>
              <div className="composition-list">
                {plat.composition.map((c, i) => {
                  const p = prod(c.producteurId);
                  return (
                    <div className="composition-row" key={i}>
                      <span className="item">{tc(c.libelle)}</span>
                      {p && (
                        <span className="producer-tag">
                          {p.prenom} · {p.km} km
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {plat.allergenes.length > 0 && (
            <>
              <div className="section-label">{tm("allergenes")}</div>
              <p className="dish-long" style={{ marginTop: 0 }}>
                {plat.allergenes.join(" · ")}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
