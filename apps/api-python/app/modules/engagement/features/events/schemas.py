"""schemas.py — corps d'entrée de POST /events."""

import uuid

from app.shared.schema import CamelModel


class EventIn(CamelModel):
    """Un événement d'engagement envoyé par le front (clés camelCase acceptées)."""

    slug: str                       # restaurant concerné
    type: str                       # "vue_plat" | "vue_producteur" | ...
    sujet_id: uuid.UUID | None = None     # ← "sujetId" (plat/producteur regardé)
    table_id: uuid.UUID | None = None     # ← "tableId"
