"""Modèle ORM du restaurant. Table physique "restaurants"."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Restaurant(SQLModel, table=True):
    __tablename__ = "restaurants"

    id: uuid.UUID = Field(primary_key=True)
    slug: str
    nom: str
    ville: str
    # Coordonnées géographiques (le point central pour la carte du territoire).
    # Remplies par géocodage de la ville (voir app/scripts/geocode.py).
    latitude: float | None = None
    longitude: float | None = None
    # NOT NULL en base — on fournit un défaut pour que la CRÉATION fonctionne.
    langues: list = Field(default_factory=lambda: ["fr"], sa_column=Column(JSONB, nullable=False))
