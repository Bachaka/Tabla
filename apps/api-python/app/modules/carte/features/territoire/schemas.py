"""schemas.py — DTO de la recherche spatiale de producteurs (PostGIS)."""

import uuid

from app.shared.schema import CamelModel


class ProducteurProche(CamelModel):
    id: uuid.UUID
    prenom: str
    atelier: str
    village: str
    distance_km: float  # calculée par PostGIS (ST_Distance sur geography) → "distanceKm"
