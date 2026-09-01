/**
 * Tests du client API du menu (fetchMenu).
 *
 * On ne touche pas le vrai réseau : on REMPLACE `fetch` par une fonction
 * simulée (vi.fn). On vérifie deux choses : la bonne URL est appelée, et une
 * réponse non-ok lève une erreur exploitable.
 */
import { afterEach, expect, it, vi } from "vitest";

import { fetchMenu } from "./api";

afterEach(() => {
  vi.unstubAllGlobals(); // on remet le vrai `fetch` après chaque test
});

it("appelle la bonne URL (API versionnée) et renvoie le JSON", async () => {
  const carte = { restaurant: { slug: "maison-salice" }, categories: [], plats: [], producteurs: [] };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => carte });
  vi.stubGlobal("fetch", fetchMock);

  const res = await fetchMenu("maison-salice");

  expect(fetchMock).toHaveBeenCalledWith("/api/v1/restaurants/maison-salice/menu");
  expect(res).toEqual(carte);
});

it("lève une erreur si la réponse n'est pas ok", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

  await expect(fetchMenu("inconnu")).rejects.toThrow("menu 404");
});
