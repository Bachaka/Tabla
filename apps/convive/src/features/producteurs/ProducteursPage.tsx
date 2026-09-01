/**
 * features/producteurs/ProducteursPage — annuaire + carte du territoire.
 * Deux vues : la grille de tuiles, et une CARTE interactive (Leaflet) plaçant
 * chaque atelier autour du restaurant, avec sa distance (Haversine, calculée
 * côté serveur). Répond à l'exigence NSY209 §4.2.5 (géolocalisation).
 */
import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { recordEvent } from "../../shared/events/api";
import { useI18n } from "../../shared/i18n";
import type { Carte, Producteur } from "../../shared/menu/api";
import { FicheProducteur } from "./FicheProducteur";

// Repli si le restaurant n'a pas de coordonnées (Saint-Rémy-de-Provence).
const CENTRE_DEFAUT: [number, number] = [43.7886, 4.8317];

function TuileProducteur({ p, onOpen }: { p: Producteur; onOpen: () => void }) {
  return (
    <button className="producer-tile" onClick={onOpen}>
      <div className="tile-avatar">
        {p.urlPortrait && <img src={p.urlPortrait} alt="" loading="lazy" />}
      </div>
      <div className="firstname serif">{p.prenom}</div>
      <div className="workshop">{p.atelier}</div>
      <div className="distance">{p.km} km</div>
      <div className="labels">
        {p.labels.map((l) => (
          <span key={l} className="label-chip">
            {l}
          </span>
        ))}
      </div>
    </button>
  );
}

/** Carte du territoire : le restaurant + les ateliers, positionnés par lat/long. */
function CarteTerritoire({
  producteurs,
  restaurant,
  onOpen,
}: {
  producteurs: Producteur[];
  restaurant: Carte["restaurant"];
  onOpen: (p: Producteur) => void;
}) {
  const { tm } = useI18n();
  const centre: [number, number] =
    restaurant.latitude != null && restaurant.longitude != null
      ? [restaurant.latitude, restaurant.longitude]
      : CENTRE_DEFAUT;
  const situes = producteurs.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <div className="fade-in">
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer
          center={centre}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: "60vh", width: "100%" }}
        >
          {/* Fond de carte OpenStreetMap (attribution obligatoire). */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Le restaurant, au centre (terracotta). */}
          <CircleMarker
            center={centre}
            radius={9}
            pathOptions={{ color: "#8B3A2F", fillColor: "#8B3A2F", fillOpacity: 0.9, weight: 2 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {restaurant.nom}
            </Tooltip>
          </CircleMarker>

          {/* Chaque producteur (olive) — clic = ouvre sa fiche. */}
          {situes.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude as number, p.longitude as number]}
              radius={7}
              pathOptions={{ color: "#4A6741", fillColor: "#4A6741", fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => onOpen(p) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {p.prenom} · {p.km} km
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: "var(--ink-mute)" }}>
        {tm("ateliers_autour")
          .replace("{n}", String(situes.length))
          .replace("{nom}", restaurant.nom)}
      </p>
    </div>
  );
}

export function ProducteursPage({
  producteurs,
  restaurant,
  slug,
  tableId,
}: {
  producteurs: Producteur[];
  restaurant: Carte["restaurant"] | undefined;
  slug: string;
  tableId: string | null;
}) {
  const { tm } = useI18n();
  const [open, setOpen] = useState<Producteur | null>(null);
  const [vue, setVue] = useState<"annuaire" | "carte">("annuaire");

  const ouvrir = (p: Producteur) => {
    recordEvent(slug, "vue_producteur", p.id, tableId);
    setOpen(p);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-eyebrow">{tm("prod_eyebrow")}</div>
        <h1 className="page-title">{tm("prod_titre")}</h1>
        <p className="page-sub">{tm("prod_sub")}</p>

        {/* Bascule Annuaire / Carte du territoire */}
        <div className="filters-row">
          <div className="filters-strip" role="tablist">
            <button
              role="tab"
              className="filter-chip"
              aria-pressed={vue === "annuaire"}
              onClick={() => setVue("annuaire")}
            >
              {tm("vue_annuaire")}
            </button>
            <button
              role="tab"
              className="filter-chip"
              aria-pressed={vue === "carte"}
              onClick={() => setVue("carte")}
            >
              {tm("vue_carte")}
            </button>
          </div>
        </div>
      </div>

      {vue === "annuaire" ? (
        <div className="producer-grid">
          {producteurs.map((p) => (
            <TuileProducteur key={p.id} p={p} onOpen={() => ouvrir(p)} />
          ))}
        </div>
      ) : restaurant ? (
        <CarteTerritoire producteurs={producteurs} restaurant={restaurant} onOpen={ouvrir} />
      ) : (
        <p className="page-sub">{tm("carte_indispo")}</p>
      )}

      {open && <FicheProducteur producteur={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
