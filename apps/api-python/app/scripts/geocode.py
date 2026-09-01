"""
Géocodage des lieux (villages) en coordonnées lat/long via l'API publique
**Nominatim** (OpenStreetMap), puis calcul de la distance restaurant ↔ producteur
par **Haversine**. Répond à l'exigence NSY209 §4.2.5 (géolocalisation).

Étapes (idempotent) :
  1. Ajoute les colonnes latitude/longitude si absentes.
  2. Tente d'activer l'extension **PostGIS** (best-effort — nécessite qu'elle soit
     autorisée côté serveur Azure ; sinon on se contente de Haversine en Python).
  3. Géocode le restaurant + chaque producteur (1 requête/seconde, User-Agent
     obligatoire — règle d'usage de Nominatim). Repli sur des coordonnées connues
     si l'API est injoignable, pour que la démo fonctionne toujours.
  4. Écrit lat/long + km recalculé en base ET dans seed_data.json (reproductible).

    uv run python -m app.scripts.geocode
"""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from sqlalchemy import text

from app.core.db import admin_engine
from app.shared.geo import haversine_km

NOMINATIM = "https://nominatim.openstreetmap.org/search"
# Nominatim EXIGE un User-Agent identifiant l'application (sinon requêtes bloquées).
UA = "Tabla/1.0 (projet NSY209 CNAM Paris; issiaka.cisse.auditeur@lecnam.net)"

# Repli hors-ligne : coordonnées connues des lieux de démonstration (Provence).
FALLBACK = {
    "Saint-Rémy-de-Provence": (43.7887, 4.8320),
    "Eygalières": (43.7620, 4.9460),
    "Bédoin": (44.1240, 5.1790),
    "Saint-Rémy": (43.7887, 4.8320),
    "Mollégès": (43.8010, 4.9260),
}

SEED_FILE = Path(__file__).resolve().parent.parent / "db" / "seed_data.json"


def geocode(
    lieu: str, viewbox: tuple[float, float, float, float] | None = None
) -> tuple[float, float, str] | None:
    """Retourne (lat, lon, source) pour un lieu, via Nominatim ou repli.

    `viewbox` (lon_min, lat_min, lon_max, lat_max) + bounded=1 restreint la
    recherche à une zone géographique — indispensable pour lever l'ambiguïté des
    noms de communes fréquents (ex. « Saint-Rémy » existe des dizaines de fois).
    """
    params = {"q": f"{lieu}, France", "format": "json", "limit": 1}
    if viewbox is not None:
        params["viewbox"] = ",".join(str(x) for x in viewbox)
        params["bounded"] = 1
    query = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{NOMINATIM}?{query}", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"]), "nominatim"
    except Exception as e:  # réseau coupé, quota, etc. → on tentera le repli
        print(f"    (Nominatim indisponible : {str(e)[:60]})")
    if lieu in FALLBACK:
        lat, lon = FALLBACK[lieu]
        return lat, lon, "repli"
    return None


def main() -> None:
    # 1. Colonnes + 2. PostGIS
    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
        for tbl in ("restaurants", "producteurs"):
            c.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS latitude double precision"))
            c.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS longitude double precision"))
        try:
            c.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            print("PostGIS : activé (requêtes spatiales possibles).")
        except Exception as e:
            print(f"PostGIS : non activé ({str(e)[:70]}) — Haversine (Python) suffira.")

    coords_par_village: dict[str, tuple[float, float]] = {}
    resto_coords: tuple[float, float] | None = None

    # 3. Géocodage (base)
    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
        resto = c.execute(
            text("SELECT id, ville FROM restaurants WHERE slug = 'maison-salice'")
        ).first()
        if resto:
            g = geocode(resto.ville)
            time.sleep(1)  # politesse Nominatim : max 1 req/s
            if g:
                lat, lon, src = g
                resto_coords = (lat, lon)
                c.execute(
                    text("UPDATE restaurants SET latitude = :la, longitude = :lo WHERE id = :i"),
                    {"la": lat, "lo": lon, "i": resto.id},
                )
                print(f"  Restaurant {resto.ville} : {lat:.4f}, {lon:.4f} ({src})")

        # Boîte de recherche ≈ ±1,2° (~130 km) autour du restaurant : les
        # producteurs sont locaux, on borne pour éviter les homonymes lointains.
        box = None
        if resto_coords:
            la, lo = resto_coords
            box = (lo - 1.2, la - 1.2, lo + 1.2, la + 1.2)

        prods = c.execute(text("SELECT id, village, prenom FROM producteurs")).all()
        for p in prods:
            g = geocode(p.village, viewbox=box)
            time.sleep(1)
            if not g:
                print(f"  ! aucune coordonnée pour {p.village}")
                continue
            lat, lon, src = g
            coords_par_village[p.village] = (lat, lon)
            km = round(haversine_km(*resto_coords, lat, lon)) if resto_coords else None
            c.execute(
                text(
                    "UPDATE producteurs SET latitude = :la, longitude = :lo, "
                    "km = COALESCE(:km, km) WHERE id = :i"
                ),
                {"la": lat, "lo": lon, "km": km, "i": p.id},
            )
            print(f"  {p.prenom} ({p.village}) : {lat:.4f}, {lon:.4f} ({src}) | {km} km")

    # 4. Réaligne seed_data.json (installations futures reproductibles)
    if SEED_FILE.exists():
        data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
        for row in data.get("restaurants", []):
            if row.get("slug") == "maison-salice" and resto_coords:
                row["latitude"], row["longitude"] = resto_coords
        for row in data.get("producteurs", []):
            v = row.get("village")
            if v in coords_par_village:
                row["latitude"], row["longitude"] = coords_par_village[v]
                if resto_coords:
                    row["km"] = round(haversine_km(*resto_coords, *coords_par_village[v]))
        SEED_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("  seed_data.json mis à jour (lat/long + km).")

    # 5. Colonne PostGIS `geography` + index spatial GiST (requêtes ST_DWithin /
    #    ST_Distance optimisées). Peuplée depuis lat/long. Best-effort (PostGIS).
    try:
        with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
            for tbl in ("restaurants", "producteurs"):
                c.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS geo geography(Point,4326)"))
                c.execute(
                    text(
                        f"UPDATE {tbl} SET geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography "
                        f"WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
                    )
                )
                c.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{tbl}_geo ON {tbl} USING gist (geo)"))
        print("  Colonnes PostGIS `geo` + index GiST prêtes (requêtes spatiales).")
    except Exception as e:
        print(f"  (colonne geo PostGIS non créée : {str(e)[:70]})")

    print("[geocode] OK")


if __name__ == "__main__":
    main()
