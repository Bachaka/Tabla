"""Repository de l'entité Table (de salle)."""

import uuid
from collections.abc import Sequence

from sqlalchemy import func
from sqlmodel import select

from app.db.models import Table, Zone

from .base import Repository


class TableRepository(Repository):
    def get(self, table_id: uuid.UUID) -> Table | None:
        return self.session.get(Table, table_id)

    def get_par_libelle(self, restaurant_id: uuid.UUID, libelle: str) -> Table | None:
        return self.session.exec(
            select(Table).where(Table.restaurant_id == restaurant_id, Table.libelle == libelle)
        ).first()

    def compter(self) -> int:
        return self.session.exec(select(func.count()).select_from(Table)).one()

    def compter_par_restaurant(self, restaurant_id: uuid.UUID) -> int:
        return self.session.exec(
            select(func.count()).select_from(Table).where(Table.restaurant_id == restaurant_id)
        ).one()

    def lister_avec_zone(self, restaurant_id: uuid.UUID) -> Sequence:
        """Tables d'un restaurant + nom de leur zone (jointure externe)."""
        return self.session.exec(
            select(Table, Zone.nom)
            .join(Zone, Table.zone_id == Zone.id, isouter=True)
            .where(Table.restaurant_id == restaurant_id)
            .order_by(Table.libelle)
        ).all()

    def ajouter(self, table: Table) -> None:
        self.session.add(table)

    def supprimer(self, table: Table) -> None:
        self.session.delete(table)
