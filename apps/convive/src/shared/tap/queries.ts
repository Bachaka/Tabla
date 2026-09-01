/**
 * shared/tap/queries — hook de résolution de tap.
 * `enabled: !!uid` : la requête ne part QUE si un uid est présent (sinon on est
 * en mode démo, sans tap).
 */
import { useQuery } from "@tanstack/react-query";
import { fetchTap } from "./api";

export function useTap(uid: string | null) {
  return useQuery({
    queryKey: ["tap", uid],
    queryFn: () => fetchTap(uid as string),
    enabled: uid != null,
  });
}
