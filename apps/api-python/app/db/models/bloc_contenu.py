"""Modèle ORM d'un bloc éditorial. Table "blocs_contenu" (PK composite)."""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class BlocContenu(SQLModel, table=True):
    __tablename__ = "blocs_contenu"

    restaurant_id: uuid.UUID = Field(primary_key=True)
    cle: str = Field(primary_key=True)
    contenu: dict = Field(sa_column=Column(JSONB, nullable=False))
