"""Modèle ORM d'une table de salle. Table physique "tables"."""

import uuid

from sqlmodel import Field, SQLModel


class Table(SQLModel, table=True):
    __tablename__ = "tables"

    id: uuid.UUID = Field(primary_key=True)
    restaurant_id: uuid.UUID
    libelle: str  # ex. "07"
    zone_id: uuid.UUID | None = None
