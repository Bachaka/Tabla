"""
Briques partagées par les scripts de schéma/seed.

• SEED_ORDER : les modèles dans l'ordre d'insertion (les « parents » avant les
  « enfants », pour respecter les clés étrangères). engagement_events en est
  ABSENT : ce sont des données d'usage (taps), pas des données de démo.
• row_to_json / cols_from_json : (dé)sérialisation d'une ligne. On passe par les
  COLONNES SQLAlchemy du modèle (pas la magie Pydantic) pour convertir sans
  surprise les types non-JSON : UUID, Decimal, datetime.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, Uuid

from app.db.models import (
    Accord,
    BlocContenu,
    CompositionPlat,
    DetailVin,
    MenuDegustation,
    Plat,
    Producteur,
    PuceNfc,
    Restaurant,
    RestaurantCrm,
    Table,
    Zone,
)

# Ordre d'insertion : un restaurant d'abord, puis ce qui en dépend, etc.
SEED_ORDER = [
    Restaurant,
    Zone,
    Table,
    Producteur,
    Plat,
    CompositionPlat,
    DetailVin,
    Accord,
    MenuDegustation,
    BlocContenu,
    PuceNfc,
    RestaurantCrm,
]


def row_to_json(obj) -> dict:
    """Une instance ORM -> dict 100 % sérialisable JSON."""
    out: dict = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, uuid.UUID):
            val = str(val)
        elif isinstance(val, Decimal):
            val = str(val)  # str, pas float : on ne perd pas de précision
        elif isinstance(val, datetime):
            val = val.isoformat()
        out[col.name] = val
    return out


def cols_from_json(model, data: dict) -> dict:
    """dict JSON -> dict de kwargs typés pour construire `model(**kwargs)`.

    Les modèles `table=True` ne valident pas à la construction : on convertit
    donc nous-mêmes chaque colonne selon son type SQLAlchemy.
    """
    kwargs: dict = {}
    for col in model.__table__.columns:
        if col.name not in data:
            continue
        val = data[col.name]
        if val is not None:
            if isinstance(col.type, Uuid):
                val = uuid.UUID(val)
            elif isinstance(col.type, Numeric):
                val = Decimal(str(val))
            elif isinstance(col.type, DateTime):
                val = datetime.fromisoformat(val)
        kwargs[col.name] = val
    return kwargs
