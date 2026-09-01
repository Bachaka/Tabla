"""
app/core/db.py — la connexion à la base (couche « core », transverse).

• engine : le pool de connexions (créé une fois pour toute l'app).
• get_session : la dépendance FastAPI qui prête une session par requête et la
  referme automatiquement.
"""

from collections.abc import Generator

from sqlmodel import Session, create_engine

from .config import settings

# Moteur RUNTIME = compte applicatif (soumis à RLS). C'est lui qu'utilise l'API.
# pool_pre_ping évite les connexions mortes (Azure coupe les connexions inactives).
engine = create_engine(
    settings.app_database_url,
    echo=False,
    pool_pre_ping=True,
)

# Moteur ADMIN (propriétaire) = pour les scripts hors requête (init_db, seed…),
# qui créent les tables et doivent passer AU-DESSUS de RLS.
admin_engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    # Le `with` referme la session à la fin de la requête, même en cas d'erreur.
    with Session(engine) as session:
        try:
            yield session
        finally:
            # Réinitialise le locataire RLS avant que la connexion ne retourne
            # au pool (évite toute fuite vers la requête suivante). Import local
            # pour éviter un cycle d'imports (tenant importe Session).
            from app.core.tenant import clear_tenant

            clear_tenant(session)
