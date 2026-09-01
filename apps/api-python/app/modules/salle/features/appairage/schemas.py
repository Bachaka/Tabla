"""schemas.py — DTO de l'appairage puce↔table (côté Restaurateur)."""

import uuid

from app.shared.schema import CamelModel


class TableOut(CamelModel):
    id: uuid.UUID
    libelle: str
    zone_id: uuid.UUID | None   # → "zoneId" (pour pré-remplir un formulaire)
    zone: str | None            # nom de la zone (jointure), sinon None
    occupee: bool               # une puce 'appairee' est déjà posée sur cette table


class TagOut(CamelModel):
    id: uuid.UUID
    uid_court: str          # → "uidCourt"
    uid: str
    statut: str             # approvisionnee | appairee | desactivee | defaillante
    table_id: uuid.UUID | None
    libelle_table: str | None


class PairIn(CamelModel):
    """Corps du PUT : la table cible, ou null pour désappairer."""

    table_id: uuid.UUID | None = None   # → "tableId"
