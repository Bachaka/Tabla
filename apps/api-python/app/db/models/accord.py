"""Modèle ORM d'un accord mets-vin. Table "accords" (clé primaire composite)."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Accord(SQLModel, table=True):
    __tablename__ = "accords"

    plat_id: uuid.UUID = Field(primary_key=True)
    plat_vin_id: uuid.UUID = Field(primary_key=True)
    note: dict = Field(sa_column=Column(JSONB, nullable=False))
