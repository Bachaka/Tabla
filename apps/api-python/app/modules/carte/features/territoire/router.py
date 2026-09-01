"""
router.py — recherche spatiale : producteurs dans un rayon (PostGIS).

Répond à l'exigence NSY209 §3.3.3 / §4.2.5. La requête spatiale elle-même
(`ST_DWithin`, `ST_Distance`, index GiST, KNN `<->`) vit dans le
ProducteurRepository : ici le routeur ne fait que la DEMANDER. C'est justement
l'intérêt du pattern Repository — la persistance (SQL/PostGIS) est cachée.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.tenant import set_tenant
from app.db.repositories import Repositories, get_repositories

from .schemas import ProducteurProche

router = APIRouter(tags=["carte"])


@router.get(
    "/restaurants/{slug}/producteurs-proches",
    response_model=list[ProducteurProche],
)
def producteurs_proches(
    slug: str,
    rayon_km: float = Query(default=15, ge=0.1, le=500, description="rayon de recherche en km"),
    repos: Repositories = Depends(get_repositories),
) -> list[ProducteurProche]:
    """Producteurs du restaurant à moins de `rayon_km`, du plus proche au plus loin."""
    resto = repos.restaurants.get_par_slug(slug)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    set_tenant(repos.session, resto.id)  # RLS : ne voir que les producteurs de CE resto

    rows = repos.producteurs.lister_proches(resto.id, rayon_km)
    return [
        ProducteurProche(
            id=row.id,
            prenom=row.prenom,
            atelier=row.atelier,
            village=row.village,
            distance_km=float(row.distance_km),
        )
        for row in rows
    ]
