"""
router.py — statistiques d'engagement (agrégation SQL).

  • GET /restaurants/{slug}/stats — dashboard Restaurateur.
  • GET /admin/overview          — cockpit Admin (vue plateforme).

Les agrégations (func.count + group_by) vivent dans l'EvenementRepository ;
ici on ne fait qu'assembler les DTO à partir de leurs résultats.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_admin
from app.core.tenant import set_tenant
from app.db.models import Utilisateur
from app.db.repositories import Repositories, get_repositories

from .schemas import (
    OverviewAdmin,
    PlatStat,
    RestaurantRollup,
    StatsRestaurant,
    TableStat,
)

router = APIRouter(tags=["stats"])


@router.get("/restaurants/{slug}/stats", response_model=StatsRestaurant)
def stats_restaurant(
    slug: str, repos: Repositories = Depends(get_repositories)
) -> StatsRestaurant:
    resto = repos.restaurants.get_par_slug(slug)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    set_tenant(repos.session, resto.id)  # RLS : stats de CE resto

    return StatsRestaurant(
        total_taps=repos.evenements.compter(resto.id, "tap"),
        total_vues_plats=repos.evenements.compter(resto.id, "vue_plat"),
        taps_par_table=[
            TableStat(libelle=libelle, taps=n)
            for libelle, n in repos.evenements.taps_par_table(resto.id)
        ],
        plats_les_plus_vus=[
            PlatStat(nom=nom, vues=n)
            for nom, n in repos.evenements.plats_les_plus_vus(resto.id)
        ],
    )


@router.get("/admin/overview", response_model=OverviewAdmin)
def overview_admin(
    repos: Repositories = Depends(get_repositories),
    _: Utilisateur = Depends(require_admin),  # réservé à l'admin (pose le scope RLS admin)
) -> OverviewAdmin:
    restaurants = [
        RestaurantRollup(nom=nom, slug=slug, ville=ville, taps=n)
        for nom, slug, ville, n in repos.evenements.rollup_par_restaurant()
    ]
    return OverviewAdmin(
        nb_restaurants=repos.restaurants.compter(),
        nb_tables=repos.tables.compter(),
        nb_puces=repos.puces.compter(),
        total_taps=repos.evenements.compter_global("tap"),
        total_evenements=repos.evenements.compter_global(),
        restaurants=restaurants,
    )
