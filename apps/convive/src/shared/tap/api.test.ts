/**
 * Tests du client de résolution de tap (fetchTap).
 *
 * Point sensible : l'uid NFC contient des « : » (ex. 04:A1:B2…). Il DOIT être
 * encodé dans l'URL (encodeURIComponent) sinon le « : » casse le chemin. Ce
 * test verrouille ce comportement.
 */
import { afterEach, expect, it, vi } from "vitest";

import { fetchTap } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("encode l'uid dans l'URL (les « : » deviennent %3A)", async () => {
  const ctx = { restaurant: { slug: "maison-salice" }, table: null, service: "midi", cible: { kind: "menu" }, lang: "fr" };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ctx });
  vi.stubGlobal("fetch", fetchMock);

  const res = await fetchTap("04:A1:B2");

  expect(fetchMock).toHaveBeenCalledWith("/t/04%3AA1%3AB2");
  expect(res).toEqual(ctx);
});

it("lève une erreur si la puce est inconnue (404)", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

  await expect(fetchTap("uid-inconnu")).rejects.toThrow("tap 404");
});
