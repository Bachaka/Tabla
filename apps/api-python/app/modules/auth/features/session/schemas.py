"""schemas.py — DTO de l'authentification (login + utilisateur courant)."""

import uuid

from app.shared.schema import CamelModel


class LoginIn(CamelModel):
    email: str
    password: str


class UserOut(CamelModel):
    id: uuid.UUID
    email: str
    role: str                        # 'admin' | 'restaurateur'
    restaurant_id: uuid.UUID | None
    restaurant_slug: str | None      # pour que le front cible le bon resto


class TokenOut(CamelModel):
    access_token: str                # → "accessToken"
    token_type: str = "bearer"       # → "tokenType"
    user: UserOut
