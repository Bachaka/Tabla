"""
app/core/tenant.py — pose le « locataire courant » pour Row-Level Security.

RLS (dans PostgreSQL) filtre les lignes selon une variable de session. On la
pose avec set_config(nom, valeur, is_local=FALSE) : niveau SESSION, elle reste
valable jusqu'à la fin de la requête — y compris APRÈS le commit, quand l'ORM
recharge une ligne pour construire la réponse. `clear_tenant` la réinitialise
au retour de la connexion dans le pool (sinon une connexion réutilisée
garderait le locataire de la requête précédente).
"""

import uuid

from sqlalchemy import text
from sqlmodel import Session


def set_tenant(session: Session, restaurant_id: uuid.UUID) -> None:
    """Déclare le restaurant courant : les policies ne montrent que ses lignes."""
    session.execute(
        text("SELECT set_config('app.current_restaurant', :rid, false)"),
        {"rid": str(restaurant_id)},
    )


def set_admin_scope(session: Session) -> None:
    """Drapeau admin : les policies laissent tout passer (vue plateforme)."""
    session.execute(text("SELECT set_config('app.admin', 'on', false)"))


def clear_tenant(session: Session) -> None:
    """Efface le locataire (au retour de la connexion) : '' = plus rien de visible."""
    try:
        session.execute(
            text("SELECT set_config('app.current_restaurant', '', false), "
                 "set_config('app.admin', '', false)")
        )
        session.commit()
    except Exception:
        session.rollback()
