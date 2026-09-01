"""
app/core/security.py — primitives de sécurité (couche « core », transverse).

• Hachage des mots de passe avec Argon2id (jamais de mot de passe en clair).
• Création / vérification des JWT (jetons signés d'authentification).

On ne stocke JAMAIS le mot de passe : on garde une empreinte Argon2id. À la
connexion, on re-hache le mot de passe fourni et on compare les empreintes.
"""

from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from .config import settings

# PasswordHasher = Argon2id par défaut (l'algo recommandé par le CDC).
_hasher = PasswordHasher()


def hash_password(plain: str) -> str:
    """Mot de passe en clair → empreinte Argon2id (à stocker en base)."""
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Le mot de passe correspond-il à l'empreinte ?"""
    try:
        return _hasher.verify(hashed, plain)
    except VerifyMismatchError:
        return False


def create_access_token(subject: str, role: str, restaurant_id: str | None) -> str:
    """Fabrique un JWT signé décrivant l'utilisateur (Factory de token)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,                 # l'id de l'utilisateur
        "role": role,                   # 'admin' | 'restaurateur'
        "rid": restaurant_id,           # restaurant lié (ou None)
        "iat": now,                     # émis à
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),  # expire à
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Vérifie la signature + l'expiration, et renvoie le contenu du token.

    Lève jwt.InvalidTokenError (dont ExpiredSignatureError) si invalide.
    """
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
