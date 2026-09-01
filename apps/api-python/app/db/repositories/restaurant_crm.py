"""Repository des données CRM d'un restaurant (table restaurant_crm)."""

import uuid

from app.db.models import RestaurantCrm

from .base import Repository


class RestaurantCrmRepository(Repository):
    def get(self, restaurant_id: uuid.UUID) -> RestaurantCrm | None:
        return self.session.get(RestaurantCrm, restaurant_id)

    def ajouter(self, crm: RestaurantCrm) -> None:
        self.session.add(crm)

    def supprimer(self, crm: RestaurantCrm) -> None:
        self.session.delete(crm)
