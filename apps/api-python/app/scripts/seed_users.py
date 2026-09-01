"""
Crée la table `users` (si absente) et seed 2 comptes de démo (idempotent).

    uv run python -m app.scripts.seed_users

⚠️ Mots de passe de DÉMO uniquement (base de dev). À changer pour un vrai
déploiement — ne jamais réutiliser ces identifiants en production.
"""

from sqlmodel import Session, select

from app.core.db import admin_engine as engine
from app.core.security import hash_password
from app.db.models import Restaurant, Utilisateur

# Comptes de démo : (email, mot de passe en clair, rôle, slug du resto ou None)
COMPTES = [
    ("admin@tabla.test", "admin1234", "admin", None),
    ("gerant@maison-salice.test", "resto1234", "restaurateur", "maison-salice"),
]


def main() -> None:
    Utilisateur.__table__.create(engine, checkfirst=True)  # crée la table si absente

    with Session(engine) as s:
        for email, mdp, role, slug in COMPTES:
            if s.exec(select(Utilisateur).where(Utilisateur.email == email)).first() is not None:
                print(f"  {email:<32} — déjà présent, ignoré")
                continue

            restaurant_id = None
            if slug is not None:
                resto = s.exec(select(Restaurant).where(Restaurant.slug == slug)).first()
                restaurant_id = resto.id if resto else None

            s.add(
                Utilisateur(
                    email=email,
                    hash_mdp=hash_password(mdp),
                    role=role,
                    restaurant_id=restaurant_id,
                )
            )
            s.commit()
            print(f"  {email:<32} + créé (role={role})")

    print("[seed_users] OK")


if __name__ == "__main__":
    main()
