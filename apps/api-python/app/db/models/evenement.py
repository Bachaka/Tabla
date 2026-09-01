"""
Modèle ORM d'un événement d'engagement. Table physique "evenements".

Anonyme : attribué à une TABLE + un service, jamais à une personne (RGPD by
design). C'est la trace analytique de Tabla (tap, consultation de plat…).
"""

import uuid

from sqlmodel import Field, SQLModel


class Evenement(SQLModel, table=True):
    __tablename__ = "evenements"

    # id : bigserial auto-incrémenté par la base → None à l'insertion, la base
    # le génère. `default=None` rend le champ optionnel côté Python.
    id: int | None = Field(default=None, primary_key=True)
    restaurant_id: uuid.UUID
    table_id: uuid.UUID | None = None
    type: str  # "tap", "vue_plat", ...
    sujet_id: uuid.UUID | None = None
    service: str  # "midi" | "soir"
    # occurred_at (horodatage) : NON mappé ici → la base applique son défaut
    # (defaultNow()) à l'insertion. On n'a pas besoin de le lire.
