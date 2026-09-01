"""
router.py — endpoints de la feature « menu ».

Le router ORCHESTRE seulement : il reçoit la requête, délègue l'accès aux
données aux **Repositories** (aucun SQL ici), assemble la réponse. Comparé à
avant, il ne connaît plus ni `select`, ni les noms de colonnes.
"""

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException

from app.core.tenant import set_tenant
from app.db.repositories import Repositories, get_repositories

from .schemas import MenuOut, PlatOut

# Un router = un sous-ensemble d'endpoints, monté ensuite dans l'app avec un
# préfixe (ici /api/v1, voir main.py). tags= regroupe les routes dans /docs.
router = APIRouter(tags=["carte"])

# Ordre canonique des catégories (comme le front les affiche).
CATEGORIES = ["Entrées", "Plats", "Desserts", "Vins"]


@router.get("/restaurants/{slug}/menu", response_model=MenuOut)
def get_menu(
    slug: str, repos: Repositories = Depends(get_repositories)
) -> MenuOut:
    # 1. Le restaurant par son slug (via le Repository).
    resto = repos.restaurants.get_par_slug(slug)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    set_tenant(repos.session, resto.id)  # RLS : plats/producteurs de CE resto

    # 2-4. Données du menu — le routeur DEMANDE, les Repositories savent comment.
    plats = repos.plats.lister_par_restaurant(resto.id)
    producteurs = repos.producteurs.lister_par_restaurant(resto.id)
    comp_rows = repos.compositions.lister_par_restaurant(resto.id)

    # Regroupe la composition par plat (lien « du producteur à l'assiette »).
    composition_par_plat: dict = defaultdict(list)
    for c in comp_rows:
        composition_par_plat[c.plat_id].append(
            {"libelle": c.libelle, "producteurId": str(c.producteur_id) if c.producteur_id else None}
        )

    # 5. Chaque PlatOut depuis l'ORM (from_attributes) + sa composition.
    plats_out = []
    for p in plats:
        dto = PlatOut.model_validate(p)
        dto.composition = composition_par_plat.get(p.id, [])
        plats_out.append(dto)

    # 6. Assemblage → JSON camelCase par MenuOut.
    return MenuOut(
        restaurant=resto,
        categories=CATEGORIES,
        plats=plats_out,
        producteurs=producteurs,
    )
