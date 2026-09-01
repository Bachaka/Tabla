"""
router.py — CRUD des « Restaurants clients » (F-CRM).

GET (liste), GET /{id} (détail), POST (créer), PUT /{id} (modifier),
DELETE /{id} (supprimer, bloqué si le restaurant a des éléments liés).
Les champs réels (nom/slug/ville) vivent dans "restaurants" ; les champs CRM
(forfait/score/mrr…) dans "restaurant_crm" ; tags/taps sont dérivés.
Accès aux données via les Repositories ; écritures validées par le Unit of Work.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_admin
from app.db.models import Restaurant, RestaurantCrm
from app.db.repositories import Repositories, get_repositories

from .schemas import RestaurantIn, RestaurantRow

router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])


def _row(r: Restaurant, crm: RestaurantCrm | None, repos: Repositories) -> RestaurantRow:
    """Assemble une ligne : restaurant + CRM + compteurs dérivés."""
    return RestaurantRow(
        id=r.id,
        nom=r.nom,
        slug=r.slug,
        ville=r.ville,
        forfait=crm.forfait if crm else "Essentiel",
        score_sante=crm.score_sante if crm else 75,
        mrr=crm.mrr if crm else 0,
        statut_facturation=crm.statut_facturation if crm else "trialing",
        note=crm.note if crm else None,
        tags=repos.puces.compter_par_restaurant(r.id),
        taps=repos.evenements.compter(r.id, "tap"),
    )


@router.get("/admin/restaurants", response_model=list[RestaurantRow])
def lister(repos: Repositories = Depends(get_repositories)) -> list[RestaurantRow]:
    return [_row(r, repos.restaurant_crm.get(r.id), repos) for r in repos.restaurants.lister()]


@router.get("/admin/restaurants/{rid}", response_model=RestaurantRow)
def detail(rid: uuid.UUID, repos: Repositories = Depends(get_repositories)) -> RestaurantRow:
    r = repos.restaurants.get(rid)
    if r is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    return _row(r, repos.restaurant_crm.get(rid), repos)


@router.post("/admin/restaurants", response_model=RestaurantRow, status_code=201)
def creer(payload: RestaurantIn, repos: Repositories = Depends(get_repositories)) -> RestaurantRow:
    # Slug unique.
    if repos.restaurants.get_par_slug(payload.slug) is not None:
        raise HTTPException(status_code=409, detail="slug_deja_utilise")

    r = Restaurant(id=uuid.uuid4(), slug=payload.slug, nom=payload.nom, ville=payload.ville)
    crm = RestaurantCrm(
        restaurant_id=r.id,
        forfait=payload.forfait,
        score_sante=payload.score_sante,
        mrr=payload.mrr,
        statut_facturation=payload.statut_facturation,
        note=payload.note,
    )
    # Restaurant + CRM créés dans UNE seule transaction (Unit of Work).
    repos.restaurants.ajouter(r)
    repos.restaurant_crm.ajouter(crm)
    repos.commit()
    return _row(r, crm, repos)


@router.put("/admin/restaurants/{rid}", response_model=RestaurantRow)
def modifier(
    rid: uuid.UUID, payload: RestaurantIn, repos: Repositories = Depends(get_repositories)
) -> RestaurantRow:
    r = repos.restaurants.get(rid)
    if r is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    # Slug unique (sauf lui-même).
    autre = repos.restaurants.get_par_slug(payload.slug)
    if autre is not None and autre.id != rid:
        raise HTTPException(status_code=409, detail="slug_deja_utilise")

    r.nom = payload.nom
    r.slug = payload.slug
    r.ville = payload.ville
    crm = repos.restaurant_crm.get(rid)
    if crm is None:
        crm = RestaurantCrm(restaurant_id=rid)
        repos.restaurant_crm.ajouter(crm)
    crm.forfait = payload.forfait
    crm.score_sante = payload.score_sante
    crm.mrr = payload.mrr
    crm.statut_facturation = payload.statut_facturation
    crm.note = payload.note

    repos.restaurants.ajouter(r)
    repos.commit()
    return _row(r, crm, repos)


@router.delete("/admin/restaurants/{rid}", status_code=204)
def supprimer(rid: uuid.UUID, repos: Repositories = Depends(get_repositories)) -> None:
    r = repos.restaurants.get(rid)
    if r is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")

    # Garde-fou d'intégrité : refuser si des éléments sont liés.
    lie = (
        repos.puces.compter_par_restaurant(rid)
        + repos.tables.compter_par_restaurant(rid)
        + repos.plats.compter_par_restaurant(rid)
        + repos.evenements.compter(rid)
    )
    if lie > 0:
        raise HTTPException(status_code=409, detail="restaurant_non_vide")

    crm = repos.restaurant_crm.get(rid)
    if crm is not None:
        repos.restaurant_crm.supprimer(crm)
    repos.restaurants.supprimer(r)
    repos.commit()
