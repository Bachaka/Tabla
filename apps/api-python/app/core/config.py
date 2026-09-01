"""
app/core/config.py — la configuration de l'API (couche « core », transverse).

Lit les variables d'environnement (fichier .env) avec pydantic-settings :
valide, convertit les types, et construit l'URL de connexion à Azure Postgres.
Voir le détail des choix dans l'historique du projet — ici on se concentre sur
l'essentiel.
"""

from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

# Chemin ABSOLU vers le .env. Ce fichier est maintenant dans app/core/, donc on
# remonte de TROIS crans pour atteindre la racine apps/api-python/ :
#   __file__ = app/core/config.py → .parent = core → .parent.parent = app
#   → .parent.parent.parent = apps/api-python/  (où vit le .env)
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Champs sans défaut = obligatoires (l'API refuse de démarrer s'ils manquent).
    azure_pg_host: str
    azure_pg_port: int = 5432
    azure_pg_user: str
    azure_pg_password: str
    azure_pg_database: str = "tabla_dev1"
    azure_pg_ssl: str = "require"

    # Auth (JWT) : le secret de signature vient du .env (obligatoire).
    jwt_secret: str
    jwt_expire_minutes: int = 480  # durée de validité d'un token (8 h)
    jwt_algorithm: str = "HS256"

    # Compte applicatif runtime (SOUMIS à RLS). S'il est absent, l'API retombe
    # sur le compte admin (utile en dev avant l'activation de RLS).
    app_pg_user: str | None = None
    app_pg_password: str | None = None

    # Origines autorisées pour CORS (déploiement). Liste séparée par des virgules,
    # ex. "https://convive...,https://admin...". Vide en dev (même origine via le
    # proxy Vite → pas de CORS nécessaire).
    allowed_origins: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def _url(self, user: str, password: str) -> str:
        # URL-encode l'utilisateur/mot de passe (caractères spéciaux échappés).
        return (
            f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}"
            f"@{self.azure_pg_host}:{self.azure_pg_port}/{self.azure_pg_database}"
            f"?sslmode={self.azure_pg_ssl}"
        )

    @property
    def database_url(self) -> str:
        """Connexion ADMIN (propriétaire) — pour les scripts (init_db, seed…)."""
        return self._url(self.azure_pg_user, self.azure_pg_password)

    @property
    def app_database_url(self) -> str:
        """Connexion RUNTIME de l'API — compte applicatif soumis à RLS."""
        if self.app_pg_user and self.app_pg_password:
            return self._url(self.app_pg_user, self.app_pg_password)
        return self.database_url  # repli : pas de compte applicatif défini


# Instance unique, partagée par toute l'app (lue + validée au premier import).
settings = Settings()  # type: ignore[call-arg]  # les valeurs viennent du .env
