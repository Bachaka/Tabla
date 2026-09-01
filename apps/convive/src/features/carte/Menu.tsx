/**
 * features/carte/Menu — l'écran Carte, au design du prototype.
 * Bascule service midi/soir, filtres régime, blocs par catégorie, lignes de plat.
 * Filtrage réel (nos plats ont service / regimes / signature).
 */
import { useMemo, useState } from "react";
import { Leaf, Sprout, Star, WheatOff } from "lucide-react";
import { recordEvent } from "../../shared/events/api";
import { useI18n, type Cle } from "../../shared/i18n";
import type { Plat, Producteur } from "../../shared/menu/api";
import { FichePlat } from "./FichePlat";

const CATEGORIES = ["Entrées", "Plats", "Desserts", "Vins"] as const;
// key = valeur logique (jamais traduite) ; cle = libellé i18n du filtre.
const FILTRES = [
  { key: "tous", cle: "filtre_tous" },
  { key: "vegetarien", cle: "filtre_vegetarien" },
  { key: "vegan", cle: "filtre_vegan" },
  { key: "sansGluten", cle: "filtre_sansGluten" },
  { key: "signature", cle: "filtre_signature" },
] as const;

const DIET_ICON: Record<string, typeof Leaf> = {
  vegetarien: Leaf,
  vegan: Sprout,
  sansGluten: WheatOff,
};

function LignePlat({ plat, onClick }: { plat: Plat; onClick: () => void }) {
  const { tm, tc } = useI18n();
  return (
    <button className={`dish-row${plat.disponible ? "" : " sold-out"}`} onClick={onClick}>
      <div className="thumb">
        {plat.urlPhoto && <img src={plat.urlPhoto} alt="" loading="lazy" />}
      </div>
      <div className="dish-info">
        <div className="dish-top-row">
          <div className="dish-name serif">{tc(plat.nom)}</div>
          <div className="dish-price">{Number(plat.prix)} €</div>
        </div>
        <div className="dish-short">{tc(plat.resume)}</div>
        {!plat.disponible && <div className="sold-out-tag">{tm("epuise")}</div>}
        <div className="dish-meta">
          {plat.regimes.map((d) => {
            const Ico = DIET_ICON[d];
            return (
              <span className="diet-pill" key={d}>
                {Ico && <Ico size={13} />}
              </span>
            );
          })}
          {plat.signature && (
            <span className="signature">
              <Star size={11} strokeWidth={1.5} />
              {tm("signature")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function Menu({
  plats,
  producteurs,
  slug,
  tableId,
  restaurantName,
  eyebrow,
  service,
  onToggleService,
}: {
  plats: Plat[];
  producteurs: Producteur[];
  slug: string;
  tableId: string | null;
  restaurantName: string;
  eyebrow: string;
  service: "midi" | "soir";
  onToggleService: () => void;
}) {
  const { tm } = useI18n();
  const [filtre, setFiltre] = useState<string>("tous");
  const [platOuvert, setPlatOuvert] = useState<Plat | null>(null);

  const filtres = useMemo(() => {
    let list = plats.filter((d) => !d.service || d.service === service);
    if (filtre === "signature") list = list.filter((d) => d.signature);
    else if (filtre !== "tous")
      list = list.filter((d) => (d.regimes as string[]).includes(filtre));
    return list;
  }, [plats, filtre, service]);

  const parCat = useMemo(() => {
    const out: Record<string, Plat[]> = {};
    CATEGORIES.forEach((c) => {
      out[c] = filtres.filter((d) => d.categorie === c);
    });
    return out;
  }, [filtres]);

  const ouvrir = (d: Plat) => {
    recordEvent(slug, "vue_plat", d.id, tableId);
    setPlatOuvert(d);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-eyebrow">{eyebrow}</div>
        <h1 className="page-title">{restaurantName}</h1>
        <p className="page-sub">
          {service === "midi" ? tm("svc_midi_title") : tm("svc_soir_title")}
        </p>
        <div className="service-switch">
          <span className="service-now">
            <span className={`service-dot ${service}`} />
            {service === "midi" ? tm("svc_midi") : tm("svc_soir")}
          </span>
          <button className="service-toggle-btn" onClick={onToggleService}>
            {service === "midi" ? tm("svc_voir_soir") : tm("svc_voir_midi")}
          </button>
        </div>
      </div>

      <div className="filters-row">
        <div className="filters-strip" role="tablist">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              role="tab"
              className="filter-chip"
              aria-pressed={filtre === f.key}
              onClick={() => setFiltre(f.key)}
            >
              {tm(f.cle)}
            </button>
          ))}
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const items = parCat[cat] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="category-block">
            <header className="category-head">
              <h2 className="serif">{tm(`cat_${cat}` as Cle)}</h2>
              <span className="count">{items.length} ·</span>
            </header>
            <div>
              {items.map((d) => (
                <LignePlat key={d.id} plat={d} onClick={() => ouvrir(d)} />
              ))}
            </div>
          </section>
        );
      })}

      {platOuvert && (
        <FichePlat plat={platOuvert} producteurs={producteurs} onClose={() => setPlatOuvert(null)} />
      )}
    </div>
  );
}
