"""
(Outil de DEV) Exporte les données actuelles de la base vers seed_data.json.

But : figer le contenu de démo (Maison Salice) tel qu'il est réellement en base,
sans le retaper à la main. On lance ceci UNE fois ; le JSON produit est versionné
et sert de source au script de seed. À rejouer si on modifie les données de démo.

    uv run python -m app.scripts.export_data
"""

import json
from pathlib import Path

from sqlmodel import Session, select

from app.core.db import admin_engine as engine
from app.scripts._common import SEED_ORDER, row_to_json

# app/scripts/export_data.py -> app/db/seed_data.json
SEED_FILE = Path(__file__).resolve().parent.parent / "db" / "seed_data.json"


def main() -> None:
    dump: dict[str, list] = {}
    with Session(engine) as s:
        for model in SEED_ORDER:
            rows = s.exec(select(model)).all()
            table = model.__tablename__
            dump[table] = [row_to_json(r) for r in rows]
            print(f"  {table:<18} {len(rows):>3} ligne(s)")

    SEED_FILE.write_text(
        json.dumps(dump, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[export_data] écrit -> {SEED_FILE}")


if __name__ == "__main__":
    main()
