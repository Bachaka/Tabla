"""
router.py — inventaire du parc NFC (Admin) : liste, création de lot, détail.

Jointures externes (une puce peut ne pas être affectée). Accès via Repositories.
"""

import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_admin
from app.db.models import PuceNfc
from app.db.repositories import Repositories, get_repositories

from .schemas import LotIn, TagDetail, TagOut

# dependencies=[…] : la garde s'applique à TOUS les endpoints de ce router.
router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])


def _uid_court(uid: str) -> str:
    """Identifiant court lisible : les 6 derniers caractères hex, en majuscule."""
    return uid.replace(":", "")[-6:].upper()


def _gen_uid() -> str:
    """UID NFC au format du parc : 7 octets hex séparés par ':' (préfixe NXP 04)."""
    octets = ["04"] + [f"{secrets.randbelow(256):02X}" for _ in range(6)]
    return ":".join(octets)


@router.get("/admin/tags", response_model=list[TagOut])
def lister_puces(repos: Repositories = Depends(get_repositories)) -> list[TagOut]:
    return [
        TagOut(
            id=puce.id,
            uid_court=_uid_court(puce.uid),
            uid=puce.uid,
            statut=puce.statut,
            nom_restaurant=rname,
            libelle_table=tlabel,
            type_cible=(puce.cible or {}).get("kind", "menu"),
        )
        for puce, rname, tlabel in repos.puces.lister_inventaire()
    ]


@router.post("/admin/tags", response_model=list[TagOut], status_code=201)
def creer_lot(payload: LotIn, repos: Repositories = Depends(get_repositories)) -> list[TagOut]:
    """Crée un lot de N puces 'approvisionnee' rattachées à un restaurant."""
    resto = repos.restaurants.get(payload.restaurant_id)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")

    existants = repos.puces.uids_existants()  # unicité des uid du nouveau lot
    resto_nom = resto.nom                     # capturé AVANT le commit
    lignes: list[tuple[uuid.UUID, str]] = []

    for _ in range(payload.quantite):
        uid = _gen_uid()
        while uid in existants:  # collision quasi impossible, mais on couvre
            uid = _gen_uid()
        existants.add(uid)
        pid = uuid.uuid4()
        repos.puces.ajouter(
            PuceNfc(
                id=pid,
                uid=uid,
                restaurant_id=resto.id,
                table_id=None,
                statut="approvisionnee",
                cible={"kind": "menu"},
            )
        )
        lignes.append((pid, uid))

    repos.commit()

    return [
        TagOut(
            id=pid,
            uid_court=_uid_court(uid),
            uid=uid,
            statut="approvisionnee",
            nom_restaurant=resto_nom,
            libelle_table=None,
            type_cible="menu",
        )
        for pid, uid in lignes
    ]


@router.get("/admin/tags/{tag_id}", response_model=TagDetail)
def detail_puce(tag_id: uuid.UUID, repos: Repositories = Depends(get_repositories)) -> TagDetail:
    puce = repos.puces.get(tag_id)
    if puce is None:
        raise HTTPException(status_code=404, detail="unknown_tag")

    resto = repos.restaurants.get(puce.restaurant_id) if puce.restaurant_id else None
    table = repos.tables.get(puce.table_id) if puce.table_id else None

    taps_table = (
        repos.evenements.compter_par_table(puce.table_id, "tap") if puce.table_id else 0
    )

    return TagDetail(
        id=puce.id,
        uid_court=_uid_court(puce.uid),
        uid=puce.uid,
        statut=puce.statut,
        nom_restaurant=resto.nom if resto else None,
        libelle_table=table.libelle if table else None,
        type_cible=(puce.cible or {}).get("kind", "menu"),
        taps_table=taps_table,
    )
