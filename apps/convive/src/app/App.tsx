/**
 * app/App — coquille de la PWA Convive, au design du prototype.
 * .tabla (frame) + .tabla-scroll (contenu) + TabBar (navigation basse).
 * Lit le tap (?t=<uid>), charge la carte, gère l'écran et le service.
 */
import { useEffect, useState } from "react";
import { Menu } from "../features/carte/Menu";
import { ProducteursPage } from "../features/producteurs/ProducteursPage";
import { useI18n } from "../shared/i18n";
import { useMenu } from "../shared/menu/queries";
import { useTap } from "../shared/tap/queries";
import { LangSwitcher } from "./LangSwitcher";
import { TabBar } from "./TabBar";

const TAP_UID = new URLSearchParams(window.location.search).get("t");

export default function App() {
  const [tab, setTab] = useState<"menu" | "producers">("menu");
  const { tm } = useI18n();

  const { data: tap } = useTap(TAP_UID);
  const slug = tap?.restaurant.slug ?? "maison-salice";
  const { data } = useMenu(slug);

  const [service, setService] = useState<"midi" | "soir">("soir");
  // Le service initial vient du tap (une fois résolu).
  useEffect(() => {
    if (tap?.service) setService(tap.service);
  }, [tap?.service]);

  // Sombre par défaut (comme le proto).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const restaurantName = tap?.restaurant.nom ?? data?.restaurant.nom ?? "Maison Salice";
  const eyebrow =
    (service === "midi" ? tm("eyebrow_midi") : tm("eyebrow_soir")) +
    (tap?.table?.libelle ? ` · ${tm("table")} ${tap.table.libelle}` : "");
  const tableId = tap?.table?.id ?? null;

  return (
    <div className="tabla">
      <LangSwitcher langues={data?.restaurant.langues ?? ["fr"]} />
      <div className="tabla-scroll">
        {tab === "menu" && (
          <Menu
            plats={data?.plats ?? []}
            producteurs={data?.producteurs ?? []}
            slug={slug}
            tableId={tableId}
            restaurantName={restaurantName}
            eyebrow={eyebrow}
            service={service}
            onToggleService={() => setService((s) => (s === "midi" ? "soir" : "midi"))}
          />
        )}
        {tab === "producers" && (
          <ProducteursPage
            producteurs={data?.producteurs ?? []}
            restaurant={data?.restaurant}
            slug={slug}
            tableId={tableId}
          />
        )}
      </div>
      <TabBar current={tab} onChange={(t) => setTab(t as "menu" | "producers")} />
    </div>
  );
}
