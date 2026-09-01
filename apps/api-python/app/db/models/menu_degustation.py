"""Modèle ORM du menu dégustation. Table "menus_degustation"."""

import uuid
from decimal import Decimal

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class MenuDegustation(SQLModel, table=True):
    __tablename__ = "menus_degustation"

    id: uuid.UUID = Field(primary_key=True)
    restaurant_id: uuid.UUID
    prix: Decimal | None = None
    prix_accord: Decimal | None = None
    nom: dict = Field(sa_column=Column(JSONB, nullable=False))
    intro: dict = Field(sa_column=Column(JSONB, nullable=False))
    services: list = Field(sa_column=Column(JSONB, nullable=False))
