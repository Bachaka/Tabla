"""
Charge les données de démo (seed_data.json) dans la base.

Remplace apps/api/src/db/seed.ts (Node). Idempotent au niveau TABLE : si une
table contient déjà des lignes, on la SAUTE (on ne duplique pas). Pour repartir
de zéro, videz les tables (ou recréez la base) puis relancez.

    uv run python -m app.scripts.init_db   # d'abord le schéma
    uv run python -m app.scripts.seed      # puis les données
"""

import json
from pathlib import Path

from sqlmodel import Session, select

from app.core.db import admin_engine as engine
from app.scripts._common import SEED_ORDER, cols_from_json

SEED_FILE = Path(__file__).resolve().parent.parent / "db" / "seed_data.json"


def main() -> None:
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    with Session(engine) as s:
        for model in SEED_ORDER:
            table = model.__tablename__
            rows = data.get(table, [])
            if not rows:
                print(f"  {table:<18} — aucune donnée dans le JSON, ignoré")
                continue
            # Idempotence : si la table a déjà du contenu, on ne réinsère pas.
            already = s.exec(select(model)).first()
            if already is not None:
                print(f"  {table:<18} — déjà peuplée, ignoré")
                continue
            for raw in rows:
                s.add(model(**cols_from_json(model, raw)))
            s.commit()
            print(f"  {table:<18} + {len(rows)} ligne(s) insérée(s)")
    print("[seed] OK")


if __name__ == "__main__":
    main()
