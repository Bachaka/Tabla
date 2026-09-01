"""
Crée le schéma : toutes les tables déclarées par les modèles SQLModel.

Remplace `drizzle-kit push` de l'ancien projet Node. Idempotent :
create_all ne recrée pas une table déjà présente (checkfirst).

    uv run python -m app.scripts.init_db
"""

from sqlmodel import SQLModel

from app.core.db import admin_engine as engine

# NB : importer app.db.models suffit à ENREGISTRER toutes les tables dans
# SQLModel.metadata (le __init__ du package importe chaque modèle).
import app.db.models  # noqa: F401


def main() -> None:
    before = set(SQLModel.metadata.tables)
    SQLModel.metadata.create_all(engine)  # crée seulement ce qui manque
    print(f"[init_db] {len(before)} table(s) déclarée(s) :")
    for name in sorted(before):
        print(f"  - {name}")
    print("[init_db] OK (les tables déjà présentes ont été laissées telles quelles).")


if __name__ == "__main__":
    main()
