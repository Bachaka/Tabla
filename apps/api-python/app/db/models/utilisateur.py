"""Modèle ORM d'un utilisateur des back-offices. Table "utilisateurs".

Sert à l'authentification (Admin + Restaurateur). La Convive reste anonyme :
elle n'a pas de compte ici.
"""

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Utilisateur(SQLModel, table=True):
    __tablename__ = "utilisateurs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hash_mdp: str                 # empreinte Argon2id (jamais le mot de passe en clair)
    role: str                     # 'admin' | 'restaurateur'
    # Lien vers le restaurant pour un restaurateur ; None pour un admin (global).
    restaurant_id: uuid.UUID | None = None
    cree_le: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
