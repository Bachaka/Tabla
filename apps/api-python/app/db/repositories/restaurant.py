"""Repository de l'entité Restaurant : encapsule ses requêtes."""

import uuid

from sqlalchemy import func
from sqlmodel import select

from app.db.models import Restaurant

from .base import Repository


class RestaurantRepository(Repository):
    def get_par_slug(self, slug: str) -> Restaurant | None:
        return self.session.exec(select(Restaurant).where(Restaurant.slug == slug)).first()

    def get(self, restaurant_id: uuid.UUID) -> Restaurant | None:
        return self.session.get(Restaurant, restaurant_id)

    def lister(self) -> list[Restaurant]:
        return self.session.exec(select(Restaurant).order_by(Restaurant.nom)).all()

    def compter(self) -> int:
        return self.session.exec(select(func.count()).select_from(Restaurant)).one()

    def ajouter(self, restaurant: Restaurant) -> None:
        self.session.add(restaurant)

    def supprimer(self, restaurant: Restaurant) -> None:
        self.session.delete(restaurant)
