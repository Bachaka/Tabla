"""
Modèle ORM d'un élément de composition d'un plat. Table "composition_plats".

Un plat est composé d'ingrédients ; chacun peut être relié à un producteur
(producteur_id) — c'est le lien « du producteur à l'assiette ».
"""

import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class CompositionPlat(SQLModel, table=True):
    __tablename__ = "composition_plats"

    id: int | None = Field(default=None, primary_key=True)  # bigserial
    plat_id: uuid.UUID
    producteur_id: uuid.UUID | None = None
    position: int = 0
    libelle: dict = Field(sa_column=Column(JSONB, nullable=False))  # { "fr": "..." }
