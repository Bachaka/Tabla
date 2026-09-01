"""schemas.py — DTO du CRM « Restaurants clients »."""

import uuid

from app.shared.schema import CamelModel


class RestaurantRow(CamelModel):
    """Une ligne de la table CRM : champs réels + CRM + dérivés."""

    id: uuid.UUID
    nom: str
    slug: str
    ville: str
    forfait: str
    score_sante: int        # → scoreSante
    mrr: int
    statut_facturation: str # → statutFacturation
    note: float | None
    tags: int               # puces actives (dérivé de puces)
    taps: int               # dérivé (evenements)


class RestaurantIn(CamelModel):
    """Corps de création / modification (le front envoie ces champs, en camelCase)."""

    nom: str
    slug: str
    ville: str
    forfait: str = "Essentiel"
    score_sante: int = 75
    mrr: int = 0
    statut_facturation: str = "trialing"
    note: float | None = None
