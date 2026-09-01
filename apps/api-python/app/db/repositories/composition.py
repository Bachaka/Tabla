"""Repository de la composition des plats (lien plat ↔ producteur)."""

import uuid

from sqlmodel import select

from app.db.models import CompositionPlat, Plat

from .base import Repository


class CompositionRepository(Repository):
    def lister_par_restaurant(self, restaurant_id: uuid.UUID) -> list[CompositionPlat]:
        """Tous les éléments de composition des plats d'un restaurant, ordonnés."""
        return self.session.exec(
            select(CompositionPlat)
            .join(Plat, CompositionPlat.plat_id == Plat.id)
            .where(Plat.restaurant_id == restaurant_id)
            .order_by(CompositionPlat.position)
        ).all()
