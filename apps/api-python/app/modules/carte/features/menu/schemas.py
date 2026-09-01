"""
schemas.py — DTO de SORTIE de la feature « menu ».

Séparation lecture/écriture (playbook §3) : le DTO reprend les noms de colonnes
(url_photo, prenom…) et expose leur version camelCase côté API.
Ici, alias camelCase (url_photo → urlPhoto) pour coller au contrat du front.
"""

import uuid
from decimal import Decimal

from app.shared.schema import CamelModel


class RestaurantOut(CamelModel):
    id: uuid.UUID
    slug: str
    nom: str
    ville: str
    latitude: float | None = None   # point central de la carte du territoire
    longitude: float | None = None
    # Langues activées pour la carte (ex. ["fr", "en"]) : pilote le sélecteur
    # de langue du Convive. Défaut ["fr"] si la colonne est vide.
    langues: list = ["fr"]


class PlatOut(CamelModel):
    id: uuid.UUID
    categorie: str
    nom: dict
    resume: dict
    description: dict
    prix: Decimal
    signature: bool
    regimes: list
    allergenes: list
    disponible: bool
    url_photo: str | None  # → "urlPhoto"
    # Composition : liste d'ingrédients, chacun { libelle, producteurId }. Rempli
    # dans le router (jointure sur composition_plats), d'où la valeur par défaut.
    composition: list = []


class ProducteurOut(CamelModel):
    id: uuid.UUID
    code: str
    prenom: str
    atelier: str
    role: dict
    village: str
    km: int                          # distance Haversine au restaurant (recalculée)
    cap: int
    latitude: float | None = None    # pour placer le marqueur sur la carte Leaflet
    longitude: float | None = None
    labels: list
    histoire: dict
    url_portrait: str | None  # → "urlPortrait"
    url_atelier: str | None   # → "urlAtelier"
    saison: list


class MenuOut(CamelModel):
    """La réponse complète de GET /menu."""

    restaurant: RestaurantOut
    categories: list[str]
    plats: list[PlatOut]
    producteurs: list[ProducteurOut]
