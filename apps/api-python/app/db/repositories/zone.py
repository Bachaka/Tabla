"""Repository de l'entité Zone (de salle)."""

import uuid

from sqlmodel import select

from app.db.models import Zone

from .base import Repository


class ZoneRepository(Repository):
    def get(self, zone_id: uuid.UUID) -> Zone | None:
        return self.session.get(Zone, zone_id)

    def lister_par_restaurant(self, restaurant_id: uuid.UUID) -> list[Zone]:
        return self.session.exec(
            select(Zone).where(Zone.restaurant_id == restaurant_id).order_by(Zone.nom)
        ).all()

    def ajouter(self, zone: Zone) -> None:
        self.session.add(zone)
