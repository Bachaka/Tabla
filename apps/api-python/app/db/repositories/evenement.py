"""Repository de l'entité Evenement (dont les agrégations statistiques)."""

import uuid
from collections.abc import Sequence

from sqlalchemy import and_, func
from sqlmodel import select

from app.db.models import Evenement, Plat, Restaurant, Table

from .base import Repository


class EvenementRepository(Repository):
    def ajouter(self, evenement: Evenement) -> None:
        self.session.add(evenement)  # commit délégué au Unit of Work (Repositories.commit)

    def compter(self, restaurant_id: uuid.UUID, type_: str | None = None) -> int:
        stmt = select(func.count()).select_from(Evenement).where(
            Evenement.restaurant_id == restaurant_id
        )
        if type_ is not None:
            stmt = stmt.where(Evenement.type == type_)
        return self.session.exec(stmt).one()

    def compter_global(self, type_: str | None = None) -> int:
        stmt = select(func.count()).select_from(Evenement)
        if type_ is not None:
            stmt = stmt.where(Evenement.type == type_)
        return self.session.exec(stmt).one()

    def compter_par_table(self, table_id: uuid.UUID, type_: str) -> int:
        return self.session.exec(
            select(func.count())
            .select_from(Evenement)
            .where(Evenement.table_id == table_id, Evenement.type == type_)
        ).one()

    def taps_par_table(self, restaurant_id: uuid.UUID) -> Sequence:
        """(libelle_table, nb_taps) par table, du plus tapé au moins tapé."""
        return self.session.exec(
            select(Table.libelle, func.count(Evenement.id))
            .join(Table, Evenement.table_id == Table.id)
            .where(Evenement.restaurant_id == restaurant_id, Evenement.type == "tap")
            .group_by(Table.libelle)
            .order_by(func.count(Evenement.id).desc())
        ).all()

    def plats_les_plus_vus(self, restaurant_id: uuid.UUID, limite: int = 5) -> Sequence:
        """(nom_plat, nb_vues) top N, via le sujet_id des événements 'vue_plat'."""
        return self.session.exec(
            select(Plat.nom, func.count(Evenement.id))
            .join(Plat, Evenement.sujet_id == Plat.id)
            .where(Evenement.restaurant_id == restaurant_id, Evenement.type == "vue_plat")
            .group_by(Plat.id, Plat.nom)
            .order_by(func.count(Evenement.id).desc())
            .limit(limite)
        ).all()

    def rollup_par_restaurant(self) -> Sequence:
        """(nom, slug, ville, nb_taps) par restaurant — jointure EXTERNE pour
        garder les restos à 0 tap."""
        return self.session.exec(
            select(Restaurant.nom, Restaurant.slug, Restaurant.ville, func.count(Evenement.id))
            .join(
                Evenement,
                and_(Evenement.restaurant_id == Restaurant.id, Evenement.type == "tap"),
                isouter=True,
            )
            .group_by(Restaurant.id, Restaurant.nom, Restaurant.slug, Restaurant.ville)
            .order_by(func.count(Evenement.id).desc())
        ).all()
