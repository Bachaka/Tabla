/**
 * Tests de recordEvent — la mesure d'engagement « fire-and-forget ».
 *
 * Deux propriétés importantes :
 *  1. Elle POSTe le bon corps JSON vers /api/v1/events.
 *  2. Elle n'échoue JAMAIS visiblement : si le réseau tombe, l'erreur est
 *     avalée (mesurer ne doit pas casser l'expérience du convive).
 */
import { afterEach, expect, it, vi } from "vitest";

import { recordEvent } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("POSTe le bon corps JSON vers /api/v1/events", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
  vi.stubGlobal("fetch", fetchMock);

  recordEvent("maison-salice", "vue_plat", "plat-42", "table-07");

  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0]!; // '!' : on vient de vérifier l'appel
  expect(url).toBe("/api/v1/events");
  expect(init.method).toBe("POST");
  expect(init.headers).toEqual({ "Content-Type": "application/json" });
  expect(JSON.parse(init.body)).toEqual({
    slug: "maison-salice",
    type: "vue_plat",
    sujetId: "plat-42",
    tableId: "table-07",
  });
});

it("avale les erreurs réseau (ne rejette pas)", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau coupé")));

  // Ne doit pas lever, même de façon asynchrone.
  expect(() => recordEvent("s", "vue_producteur", null, null)).not.toThrow();
  await Promise.resolve(); // laisse le .catch() s'exécuter
});
