"""schemas.py — DTO du parc NFC (inventaire des puces, côté Admin)."""

import uuid

from pydantic import Field

from app.shared.schema import CamelModel


class LotIn(CamelModel):
    """Entrée pour créer un lot : N puces rattachées à un restaurant."""

    restaurant_id: uuid.UUID           # → "restaurantId" en JSON
    quantite: int = Field(ge=1, le=200)  # garde-fou : 1 à 200 puces par lot


class TagOut(CamelModel):
    id: uuid.UUID
    uid_court: str          # → "uidCourt" (identifiant court lisible)
    uid: str                # UID complet
    statut: str             # approvisionnee | appairee | desactivee | defaillante
    nom_restaurant: str | None
    libelle_table: str | None
    type_cible: str         # ce qu'ouvre la puce (ex. "menu")


class TagDetail(TagOut):
    """Détail d'une puce : les champs de l'inventaire + une stat d'engagement."""

    taps_table: int         # nombre de taps enregistrés sur la table de cette puce
