/**
 * shared/menu/queries — le hook de données du menu (TanStack Query).
 * Centralise le cache : appelé une fois dans la coquille, les features
 * reçoivent les données en props (pas d'appel API dupliqué).
 */
import { useQuery } from "@tanstack/react-query";
import { fetchMenu } from "./api";

export function useMenu(slug: string) {
  return useQuery({
    queryKey: ["menu", slug],
    queryFn: () => fetchMenu(slug),
  });
}
