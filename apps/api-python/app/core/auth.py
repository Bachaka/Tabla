"""
app/core/auth.py — dépendances d'authentification (couche « core »).

Une « dépendance » FastAPI = une fonction injectée dans un endpoint via
Depends(). Ici elles lisent le token « Authorization: Bearer <jwt> », le
valident, chargent l'utilisateur, et vérifient son rôle. Les routers les
utilisent pour PROTÉGER leurs endpoints.
"""

import uuid

import jwt
from fastapi import Depends, Header, HTTPException
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import decode_access_token
from app.core.tenant import set_admin_scope, set_tenant
from app.db.models import Restaurant, Utilisateur
from app.db.repositories import RestaurantRepository, UtilisateurRepository

_UNAUTH = {"WWW-Authenticate": "Bearer"}


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> Utilisateur:
    """Extrait l'utilisateur depuis le token, ou lève 401."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "not_authenticated", headers=_UNAUTH)
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)  # vérifie signature + expiration
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid_token", headers=_UNAUTH)

    user = UtilisateurRepository(session).get(uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(401, "unknown_user", headers=_UNAUTH)
    return user


def require_admin(
    user: Utilisateur = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Utilisateur:
    """Réservé aux comptes 'admin' (console interne). Pose le scope admin (RLS)."""
    if user.role != "admin":
        raise HTTPException(403, "forbidden")
    set_admin_scope(session)  # les policies laisseront tout passer
    return user


def require_restaurateur(user: Utilisateur = Depends(get_current_user)) -> Utilisateur:
    """Réservé aux comptes 'restaurateur' (back-office resto)."""
    if user.role != "restaurateur":
        raise HTTPException(403, "forbidden")
    return user


def get_owned_restaurant(
    slug: str,
    user: Utilisateur = Depends(require_restaurateur),
    session: Session = Depends(get_session),
) -> Restaurant:
    """Résout le restaurant du chemin ET vérifie que le restaurateur en est
    propriétaire. Combine authentification + autorisation + résolution en une
    seule dépendance, injectée par les endpoints du back-office resto.
    """
    resto = RestaurantRepository(session).get_par_slug(slug)
    if resto is None:
        raise HTTPException(404, "unknown_restaurant")
    if user.restaurant_id != resto.id:
        raise HTTPException(403, "forbidden")  # un restaurateur ≠ ce resto
    set_tenant(session, resto.id)  # RLS : ne verra que ce restaurant
    return resto
