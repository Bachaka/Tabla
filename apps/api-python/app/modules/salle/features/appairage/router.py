"""
router.py — appairage des puces aux tables, côté Restaurateur.

Le restaurateur ne voit QUE son propre restaurant (get_owned_restaurant). Accès
aux données via les Repositories.
  GET  /restaurants/{slug}/tables            → mes tables (+ occupées ou non)
  GET  /restaurants/{slug}/tags              → mes puces (+ table associée)
  PUT  /restaurants/{slug}/tags/{id}/pair    → poser/retirer une puce sur une table
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_owned_restaurant
from app.db.models import Restaurant
from app.db.repositories import Repositories, get_repositories

from .schemas import PairIn, TableOut, TagOut

router = APIRouter(tags=["salle"])


def _uid_court(uid: str) -> str:
    """Identifiant court lisible : les 6 derniers caractères hex, en majuscule."""
    return uid.replace(":", "")[-6:].upper()


@router.get("/restaurants/{slug}/tables", response_model=list[TableOut])
def lister_tables(
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> list[TableOut]:
    rows = repos.tables.lister_avec_zone(resto.id)  # (Table, nom_zone)
    occupees = repos.puces.tables_occupees(resto.id)  # ids des tables en service

    return [
        TableOut(
            id=t.id,
            libelle=t.libelle,
            zone_id=t.zone_id,
            zone=zone_nom,
            occupee=t.id in occupees,
        )
        for t, zone_nom in rows
    ]


@router.get("/restaurants/{slug}/tags", response_model=list[TagOut])
def lister_tags(
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> list[TagOut]:
    rows = repos.puces.lister_avec_table_par_restaurant(resto.id)  # (PuceNfc, libelle_table)

    return [
        TagOut(
            id=p.id,
            uid_court=_uid_court(p.uid),
            uid=p.uid,
            statut=p.statut,
            table_id=p.table_id,
            libelle_table=libelle,
        )
        for p, libelle in rows
    ]


@router.put("/restaurants/{slug}/tags/{tag_id}/pair", response_model=TagOut)
def appairer(
    tag_id: uuid.UUID,
    payload: PairIn,
    resto: Restaurant = Depends(get_owned_restaurant),
    repos: Repositories = Depends(get_repositories),
) -> TagOut:
    puce = repos.puces.get(tag_id)
    if puce is None or puce.restaurant_id != resto.id:
        raise HTTPException(status_code=404, detail="unknown_tag")

    if payload.table_id is None:
        # Désappairer : la puce retourne au stock 'approvisionnee'.
        puce.table_id = None
        puce.statut = "approvisionnee"
    else:
        table = repos.tables.get(payload.table_id)
        if table is None or table.restaurant_id != resto.id:
            raise HTTPException(status_code=404, detail="unknown_table")

        # Règle : une seule puce active par table.
        if repos.puces.occupant_table(resto.id, payload.table_id, tag_id) is not None:
            raise HTTPException(status_code=409, detail="table_occupee")

        puce.table_id = payload.table_id
        puce.statut = "appairee"

    repos.puces.ajouter(puce)
    repos.commit()

    # Libellé de la table pour la réponse (après commit).
    libelle = None
    if puce.table_id is not None:
        t = repos.tables.get(puce.table_id)
        libelle = t.libelle if t else None

    return TagOut(
        id=puce.id,
        uid_court=_uid_court(puce.uid),
        uid=puce.uid,
        statut=puce.statut,
        table_id=puce.table_id,
        libelle_table=libelle,
    )
