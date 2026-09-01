"""
Crée (ou met à jour) le compte applicatif `tabla_app` utilisé par l'API en
production/dev — le « badge d'employé » soumis à RLS (voir enable_rls.py).

Lancé avec le compte ADMIN (propriétaire). Idempotent :
  • si le rôle existe, on resynchronise juste son mot de passe ;
  • si APP_PG_PASSWORD est déjà dans .env, on le réutilise (rôle ↔ .env alignés) ;
  • sinon on génère un mot de passe et on l'écrit dans .env.

    uv run python -m app.scripts.setup_app_role

Ordre d'installation depuis zéro :
    init_db  →  seed  →  seed_users  →  setup_app_role  →  enable_rls
"""

import re
import secrets
from pathlib import Path

from sqlalchemy import text

from app.core.db import admin_engine

ROLE = "tabla_app"
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


def main() -> None:
    env = ENV_PATH.read_text(encoding="utf-8") if ENV_PATH.exists() else ""
    m = re.search(r"^APP_PG_PASSWORD=(.+)$", env, re.M)
    pwd = m.group(1).strip() if m else secrets.token_urlsafe(24)
    quoted = pwd.replace("'", "''")  # sécurise le littéral (token_urlsafe n'a pas de quote)

    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
        exists = c.execute(
            text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": ROLE}
        ).first()
        verbe = "ALTER" if exists else "CREATE"
        c.execute(text(f"{verbe} ROLE {ROLE} WITH LOGIN PASSWORD '{quoted}' NOBYPASSRLS"))

        # Droits sur le schéma, les tables et séquences existantes.
        c.execute(text(f"GRANT USAGE ON SCHEMA public TO {ROLE}"))
        c.execute(text(f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {ROLE}"))
        c.execute(text(f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {ROLE}"))

        # Droits par défaut pour les FUTURES tables/séquences créées par l'admin.
        admin_user = c.execute(text("SELECT current_user")).scalar()
        c.execute(text(
            f'ALTER DEFAULT PRIVILEGES FOR ROLE "{admin_user}" IN SCHEMA public '
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {ROLE}"
        ))
        c.execute(text(
            f'ALTER DEFAULT PRIVILEGES FOR ROLE "{admin_user}" IN SCHEMA public '
            f"GRANT USAGE, SELECT ON SEQUENCES TO {ROLE}"
        ))
    print(f"[setup_app_role] rôle {ROLE} {'mis à jour' if exists else 'créé'} + droits accordés")

    if not m:
        if env and not env.endswith("\n"):
            env += "\n"
        env += (
            "\n# Compte applicatif runtime (soumis a RLS) — jamais commite\n"
            f"APP_PG_USER={ROLE}\nAPP_PG_PASSWORD={pwd}\n"
        )
        ENV_PATH.write_text(env, encoding="utf-8")
        print("[setup_app_role] APP_PG_USER / APP_PG_PASSWORD écrits dans .env")
    else:
        print("[setup_app_role] APP_PG_* déjà présents dans .env (réutilisés)")


if __name__ == "__main__":
    main()
