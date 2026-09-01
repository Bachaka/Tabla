"""schemas.py — DTO de la gestion des tables & zones (côté Restaurateur)."""

import uuid

from pydantic import Field

from app.shared.schema import CamelModel


class ZoneOut(CamelModel):
    id: uuid.UUID
    nom: str


class ZoneIn(CamelModel):
    nom: str = Field(min_length=1)


class TableIn(CamelModel):
    libelle: str = Field(min_length=1)
    zone_id: uuid.UUID | None = None   # → "zoneId" ; None = sans zone
