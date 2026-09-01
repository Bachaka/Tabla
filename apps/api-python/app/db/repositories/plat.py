"""Repository de l'entité Plat."""

import uuid

from sqlalchemy import func
from sqlmodel import select

from app.db.models import Plat

from .base import Repository


class PlatRepository(Repository):
    def lister_par_restaurant(self, restaurant_id: uuid.UUID) -> list[Plat]:
        return self.session.exec(
            select(Plat).where(Plat.restaurant_id == restaurant_id)
        ).all()

    def get(self, plat_id: uuid.UUID) -> Plat | None:
        return self.session.get(Plat, plat_id)

    def compter_par_restaurant(self, restaurant_id: uuid.UUID) -> int:
        return self.session.exec(
            select(func.count()).select_from(Plat).where(Plat.restaurant_id == restaurant_id)
        ).one()
