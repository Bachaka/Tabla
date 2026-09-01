"""
Désactive RLS et supprime les policies (interrupteur de secours).

    uv run python -m app.scripts.disable_rls
"""

from sqlalchemy import text

from app.core.db import admin_engine
from app.scripts.enable_rls import TABLES


def main() -> None:
    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
        for t in TABLES:
            c.execute(text(f"DROP POLICY IF EXISTS tenant_isolation ON {t}"))
            c.execute(text(f"ALTER TABLE {t} DISABLE ROW LEVEL SECURITY"))
            print(f"  RLS désactivé : {t}")
    print("[disable_rls] OK")


if __name__ == "__main__":
    main()
