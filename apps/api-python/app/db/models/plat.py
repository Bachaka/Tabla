"""Modèle ORM du plat. Table physique "plats"."""

import uuid
from decimal import Decimal

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Plat(SQLModel, table=True):
    __tablename__ = "plats"

    id: uuid.UUID = Field(primary_key=True)
    restaurant_id: uuid.UUID
    code: str
    categorie: str
    # prix en Decimal (argent) → sérialisé "18.00", jamais un float.
    prix: Decimal
    signature: bool
    disponible: bool
    service: str | None = None
    url_photo: str | None = None

    # Colonnes jsonb : nom/resume/description localisés { "fr": "..." }, regimes/allergenes listes.
    nom: dict = Field(sa_column=Column(JSONB, nullable=False))
    resume: dict = Field(sa_column=Column(JSONB, nullable=False))
    description: dict = Field(sa_column=Column(JSONB, nullable=False))
    regimes: list = Field(sa_column=Column(JSONB, nullable=False))
    allergenes: list = Field(sa_column=Column(JSONB, nullable=False))
