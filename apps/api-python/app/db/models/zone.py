"""Modèle ORM d'une zone de salle. Table "zones"."""

import uuid

from sqlmodel import Field, SQLModel


class Zone(SQLModel, table=True):
    __tablename__ = "zones"

    id: uuid.UUID = Field(primary_key=True)
    restaurant_id: uuid.UUID
    nom: str
