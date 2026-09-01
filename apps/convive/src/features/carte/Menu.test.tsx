/**
 * Test de COMPOSANT de l'écran Carte (Menu).
 *
 * Contrairement aux tests de client API (logique pure), ici on MONTE le
 * composant React dans un faux DOM (jsdom) et on vérifie ce que le convive
 * voit, exactement comme dans un navigateur :
 *   - filtrage par service (midi/soir) ;
 *   - masquage des catégories vides ;
 *   - filtre « Signature » qui réduit la liste au clic.
 *
 * On teste le COMPORTEMENT observable (textes, clics), pas les détails internes.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { LangProvider } from "../../shared/i18n";
import type { Plat } from "../../shared/menu/api";
import { Menu } from "./Menu";

let compteur = 0;

/** Fabrique un plat de test valide ; `over` écrase ce qu'on veut préciser. */
function plat(over: Partial<Plat> = {}): Plat {
  compteur += 1;
  return {
    id: `plat-${compteur}`,
    code: `PLA-${compteur}`,
    categorie: "Plats",
    nom: { fr: `Plat ${compteur}` },
    resume: { fr: "Un résumé." },
    description: { fr: "Une description." },
    prix: "20",
    signature: false,
    regimes: [],
    allergenes: [],
    service: null,
    urlPhoto: null,
    disponible: true,
    composition: [],
    pairing: null,
    ...over,
  };
}

/** Monte <Menu> avec des props par défaut raisonnables.
 *  Menu utilise useI18n() → on l'enveloppe dans <LangProvider> (langue par
 *  défaut : fr, donc les libellés attendus restent en français). */
function monter(plats: Plat[], service: "midi" | "soir" = "midi") {
  return render(
    <LangProvider>
      <Menu
        plats={plats}
        producteurs={[]}
        slug="maison-salice"
        tableId={null}
        restaurantName="Maison Salice"
        eyebrow="Table 07"
        service={service}
        onToggleService={vi.fn()}
      />
    </LangProvider>,
  );
}

it("affiche les catégories qui ont des plats, masque les vides", () => {
  monter([
    plat({ categorie: "Entrées", nom: { fr: "Velouté de courge" } }),
    plat({ categorie: "Plats", nom: { fr: "Agneau des Alpilles" } }),
    plat({ categorie: "Desserts", nom: { fr: "Tarte au citron" } }),
  ]);

  expect(screen.getByRole("heading", { name: "Entrées" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Plats" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Desserts" })).toBeInTheDocument();
  // Aucun vin fourni → la catégorie « Vins » ne doit pas apparaître.
  expect(screen.queryByRole("heading", { name: "Vins" })).not.toBeInTheDocument();
});

it("au service du midi, cache un plat réservé au soir", () => {
  monter(
    [
      plat({ nom: { fr: "Risotto du soir" }, service: "soir" }),
      plat({ nom: { fr: "Agneau toute la journée" }, service: null }),
    ],
    "midi",
  );

  expect(screen.getByText("Agneau toute la journée")).toBeInTheDocument();
  expect(screen.queryByText("Risotto du soir")).not.toBeInTheDocument();
});

it("le filtre « Signature » ne garde que les plats signature", async () => {
  const user = userEvent.setup();
  monter([
    plat({ nom: { fr: "Agneau signature" }, signature: true }),
    plat({ nom: { fr: "Velouté ordinaire" }, signature: false }),
  ]);

  // Avant filtrage : les deux sont visibles.
  expect(screen.getByText("Agneau signature")).toBeInTheDocument();
  expect(screen.getByText("Velouté ordinaire")).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Signature" }));

  // Après : seul le plat signature reste.
  expect(screen.getByText("Agneau signature")).toBeInTheDocument();
  expect(screen.queryByText("Velouté ordinaire")).not.toBeInTheDocument();
});
