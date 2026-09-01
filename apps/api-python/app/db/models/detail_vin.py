"""Modèle ORM des détails d'un vin. Table "details_vins" (1-à-1 avec un plat vin)."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class DetailVin(SQLModel, table=True):
    __tablename__ = "details_vins"

    plat_id: uuid.UUID = Field(primary_key=True)
    humeur: str
    couleur: str  # rouge | rosé | blanc
    cepages: list = Field(sa_column=Column(JSONB, nullable=False))
