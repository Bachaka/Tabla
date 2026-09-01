"""
router.py — gestion des tables et zones de salle (écran « Zones de tables »).

Scopé par slug (multi-tenant, via get_owned_restaurant). Accès aux données via
les Repositories ; les écritures sont validées par le Unit of Work (repos.commit).
  GET    /restaurants/{slug}/zones           → mes zones
  POST   /restaurants/{slug}/zones           → créer une zone
  POST   /restaurants/{slug}/tables          → créer une table (libellé unique)
  PUT    /restaurants/{slug}/tables/{id}     → modifier (libellé, zone)
  DELETE /restaurants/{slug}/tables/{id}     → supprimer (bloqué si puce appairée)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_owned_restaurant
from app.db.models import Restaurant, Table, Zone
from app.db.repositories import Repositories, get_repositories

from ..appairage.schemas import TableOut
from .schemas import TableIn, ZoneIn, ZoneOut

router = APIRouter(tags=["salle"])


def _table_out(t: Table, repos: Repositories) -> TableOut:
    """Assemble le DTO d'une table : nom de zone + occupation."""
    zone = repos.zones.get(t.zone_id) if t.zone_id else None
    occupee = repos.puces.puce_active_sur_table(t.id) is not None
    return TableOut(
        id=t.id,
        libelle=t.libelle,
        zone_id=t.zone_id,
        zone=zone.nom if zone else None,
        occupee=occupee,
    )


def _verifier_zone(zone_id: uuid.UUID | None, resto: Restaurant, repos: Repositories) -> None:
    """La zone (si fournie) doit appartenir à ce restaurant."""
    if zone_id is None:
        return
    zone = repos.zones.get(zone_id)
    if zone is None or zone.restaurant_id != resto.id:
        raise HTTPException(status_code=404, detail="unknown_zone")


def _libelle_libre(
    libelle: str, resto: Restaurant, repos: Repositories, sauf_id: uuid.UUID | None = None
) -> None:
    """Refuse un libellé de table déjà pris dans ce restaurant (sauf soi-même)."""
    autre = repos.tables.get_par_libelle(resto.id, libelle)
    if autre is not None and autre.id != sauf_id:
        raise HTTPException(status_code=409, detail="label_deja_utilise")


# ── Zones ──────────────────────────────────────────────────────────────
@router.get("/restaurants/{slug}/zones", response_model=list[ZoneOut])
def lister_zones(
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> list[ZoneOut]:
    return [ZoneOut(id=z.id, nom=z.nom) for z in repos.zones.lister_par_restaurant(resto.id)]


@router.post("/restaurants/{slug}/zones", response_model=ZoneOut, status_code=201)
def creer_zone(
    payload: ZoneIn,
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> ZoneOut:
    zone = Zone(id=uuid.uuid4(), restaurant_id=resto.id, nom=payload.nom)
    repos.zones.ajouter(zone)
    repos.commit()
    return ZoneOut(id=zone.id, nom=zone.nom)


# ── Tables ─────────────────────────────────────────────────────────────
@router.post("/restaurants/{slug}/tables", response_model=TableOut, status_code=201)
def creer_table(
    payload: TableIn,
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> TableOut:
    _libelle_libre(payload.libelle, resto, repos)
    _verifier_zone(payload.zone_id, resto, repos)

    t = Table(
        id=uuid.uuid4(),
        restaurant_id=resto.id,
        libelle=payload.libelle,
        zone_id=payload.zone_id,
    )
    repos.tables.ajouter(t)
    repos.commit()
    return _table_out(t, repos)


@router.put("/restaurants/{slug}/tables/{table_id}", response_model=TableOut)
def modifier_table(
    table_id: uuid.UUID,
    payload: TableIn,
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> TableOut:
    t = repos.tables.get(table_id)
    if t is None or t.restaurant_id != resto.id:
        raise HTTPException(status_code=404, detail="unknown_table")

    _libelle_libre(payload.libelle, resto, repos, sauf_id=table_id)
    _verifier_zone(payload.zone_id, resto, repos)

    t.libelle = payload.libelle
    t.zone_id = payload.zone_id
    repos.tables.ajouter(t)
    repos.commit()
    return _table_out(t, repos)


@router.delete("/restaurants/{slug}/tables/{table_id}", status_code=204)
def supprimer_table(
    table_id: uuid.UUID,
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> None:
    t = repos.tables.get(table_id)
    if t is None or t.restaurant_id != resto.id:
        raise HTTPException(status_code=404, detail="unknown_table")

    # Garde-fou : refuser si une puce est encore appairée à cette table.
    if repos.puces.puce_active_sur_table(table_id) is not None:
        raise HTTPException(status_code=409, detail="table_a_une_puce")

    repos.tables.supprimer(t)
    repos.commit()
