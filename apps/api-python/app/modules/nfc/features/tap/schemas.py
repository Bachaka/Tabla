"""schemas.py — DTO de sortie de la résolution de tap (GET /t/{uid})."""

import uuid

from app.shared.schema import CamelModel


class TableOut(CamelModel):
    id: uuid.UUID
    libelle: str


class RestaurantOut(CamelModel):
    id: uuid.UUID
    slug: str
    nom: str
    ville: str


class TapOut(CamelModel):
    """Le contexte résolu d'un tap : où suis-je, quel service, quoi afficher."""

    restaurant: RestaurantOut
    table: TableOut | None
    service: str        # "midi" | "soir"
    cible: dict         # ce qu'il faut afficher, ex. {"kind": "menu"}
    lang: str
