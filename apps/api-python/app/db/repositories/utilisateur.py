"""Repository de l'entité Utilisateur (comptes des back-offices)."""

import uuid

from sqlmodel import select

from app.db.models import Utilisateur

from .base import Repository


class UtilisateurRepository(Repository):
    def get(self, user_id: uuid.UUID) -> Utilisateur | None:
        return self.session.get(Utilisateur, user_id)

    def get_par_email(self, email: str) -> Utilisateur | None:
        return self.session.exec(select(Utilisateur).where(Utilisateur.email == email)).first()
