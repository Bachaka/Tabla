"""Modèle ORM d'une puce NFC. Table physique "puces"."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class PuceNfc(SQLModel, table=True):
    __tablename__ = "puces"

    id: uuid.UUID = Field(primary_key=True)
    uid: str  # l'identifiant OPAQUE inscrit dans la puce (ce que lit le tap)
    restaurant_id: uuid.UUID | None = None
    table_id: uuid.UUID | None = None
    statut: str  # approvisionnee | appairee | desactivee | defaillante
    # cible : la cible résolue au tap (jsonb), ex. {"kind": "menu"}.
    cible: dict = Field(sa_column=Column(JSONB, nullable=False))
