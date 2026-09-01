"""Repository de l'entité PuceNfc (parc NFC + appairage)."""

import uuid
from collections.abc import Sequence

from sqlalchemy import func
from sqlmodel import select

from app.db.models import PuceNfc, Restaurant, Table

from .base import Repository


class PuceRepository(Repository):
    def get(self, puce_id: uuid.UUID) -> PuceNfc | None:
        return self.session.get(PuceNfc, puce_id)

    def get_par_uid(self, uid: str) -> PuceNfc | None:
        return self.session.exec(select(PuceNfc).where(PuceNfc.uid == uid)).first()

    def compter_par_restaurant(self, restaurant_id: uuid.UUID) -> int:
        return self.session.exec(
            select(func.count()).select_from(PuceNfc).where(PuceNfc.restaurant_id == restaurant_id)
        ).one()

    def compter(self) -> int:
        return self.session.exec(select(func.count()).select_from(PuceNfc)).one()

    def uids_existants(self) -> set[str]:
        return set(self.session.exec(select(PuceNfc.uid)).all())

    def tables_occupees(self, restaurant_id: uuid.UUID) -> set[uuid.UUID]:
        """Ids des tables ayant une puce en service (statut 'appairee')."""
        return set(
            self.session.exec(
                select(PuceNfc.table_id).where(
                    PuceNfc.restaurant_id == restaurant_id,
                    PuceNfc.statut == "appairee",
                    PuceNfc.table_id.is_not(None),
                )
            ).all()
        )

    def puce_active_sur_table(self, table_id: uuid.UUID) -> PuceNfc | None:
        return self.session.exec(
            select(PuceNfc).where(PuceNfc.table_id == table_id, PuceNfc.statut == "appairee")
        ).first()

    def occupant_table(
        self, restaurant_id: uuid.UUID, table_id: uuid.UUID, sauf_id: uuid.UUID
    ) -> PuceNfc | None:
        """Une AUTRE puce déjà en service sur cette table (règle : une par table)."""
        return self.session.exec(
            select(PuceNfc).where(
                PuceNfc.restaurant_id == restaurant_id,
                PuceNfc.table_id == table_id,
                PuceNfc.statut == "appairee",
                PuceNfc.id != sauf_id,
            )
        ).first()

    def lister_inventaire(self) -> Sequence:
        """Toutes les puces + (nom resto, libellé table) — jointures externes (Admin)."""
        return self.session.exec(
            select(PuceNfc, Restaurant.nom, Table.libelle)
            .join(Restaurant, PuceNfc.restaurant_id == Restaurant.id, isouter=True)
            .join(Table, PuceNfc.table_id == Table.id, isouter=True)
            .order_by(PuceNfc.uid)
        ).all()

    def lister_avec_table_par_restaurant(self, restaurant_id: uuid.UUID) -> Sequence:
        """Puces d'un restaurant + libellé de leur table (Restaurateur)."""
        return self.session.exec(
            select(PuceNfc, Table.libelle)
            .join(Table, PuceNfc.table_id == Table.id, isouter=True)
            .where(PuceNfc.restaurant_id == restaurant_id)
            .order_by(PuceNfc.uid)
        ).all()

    def ajouter(self, puce: PuceNfc) -> None:
        self.session.add(puce)
