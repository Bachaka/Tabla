"""Modèle ORM du producteur. Table physique "producteurs"."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class Producteur(SQLModel, table=True):
    __tablename__ = "producteurs"

    id: uuid.UUID = Field(primary_key=True)
    restaurant_id: uuid.UUID
    code: str
    prenom: str
    atelier: str
    village: str
    km: int            # distance au restaurant (km) — recalculée par Haversine (geocode.py)
    cap: int           # cap en degrés (héritage du proto ; la carte Leaflet utilise lat/long)
    # Coordonnées géographiques du producteur (géocodage de son adresse/village).
    latitude: float | None = None
    longitude: float | None = None
    url_portrait: str | None = None
    url_atelier: str | None = None

    # Colonnes jsonb : role/histoire localisés, labels/saison listes.
    role: dict = Field(sa_column=Column(JSONB, nullable=False))
    histoire: dict = Field(sa_column=Column(JSONB, nullable=False))
    labels: list = Field(sa_column=Column(JSONB, nullable=False))
    saison: list = Field(sa_column=Column(JSONB, nullable=False))
