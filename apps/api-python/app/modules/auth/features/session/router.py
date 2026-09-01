"""
router.py — authentification des back-offices.

  POST /auth/login  → vérifie email + mot de passe, renvoie un JWT + l'utilisateur
  GET  /auth/me     → l'utilisateur courant (depuis le token Bearer)

Accès aux données via les Repositories.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.models import Utilisateur
from app.db.repositories import Repositories, get_repositories

from .schemas import LoginIn, TokenOut, UserOut

router = APIRouter(tags=["auth"])


def _user_out(user: Utilisateur, repos: Repositories) -> UserOut:
    """Ajoute le slug du restaurant (pratique pour le front)."""
    slug = None
    if user.restaurant_id is not None:
        resto = repos.restaurants.get(user.restaurant_id)
        slug = resto.slug if resto else None
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        restaurant_id=user.restaurant_id,
        restaurant_slug=slug,
    )


@router.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, repos: Repositories = Depends(get_repositories)) -> TokenOut:
    user = repos.utilisateurs.get_par_email(payload.email)
    # Même message que le mot de passe soit faux OU l'email inconnu : on ne
    # révèle pas si l'email existe (bonne pratique de sécurité).
    if user is None or not verify_password(payload.password, user.hash_mdp):
        raise HTTPException(status_code=401, detail="invalid_credentials")

    token = create_access_token(
        subject=str(user.id),
        role=user.role,
        restaurant_id=str(user.restaurant_id) if user.restaurant_id else None,
    )
    return TokenOut(access_token=token, user=_user_out(user, repos))


@router.get("/auth/me", response_model=UserOut)
def me(
    user: Utilisateur = Depends(get_current_user),
    repos: Repositories = Depends(get_repositories),
) -> UserOut:
    return _user_out(user, repos)
