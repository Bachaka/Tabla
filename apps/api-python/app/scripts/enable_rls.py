"""
Active Row-Level Security + les policies d'isolation multi-tenant.

Lancé avec le compte ADMIN (propriétaire des tables). L'API, elle, tourne avec
le compte applicatif `tabla_app` (NOBYPASSRLS) : c'est lui qui sera filtré.

    uv run python -m app.scripts.enable_rls      # activer
    uv run python -m app.scripts.disable_rls     # tout désactiver (secours)

Tables protégées : celles qui portent un `restaurant_id`. Sont EXCLUES :
  • restaurants  (table racine : sert à identifier le locataire)
  • puces        (point d'entrée du tap : résolu par uid avant de connaître le resto)
  • tables de liaison sans restaurant_id (composition_plats, details_vins, accords)
"""

from sqlalchemy import text

from app.core.db import admin_engine

TABLES = [
    "plats",
    "tables",
    "zones",
    "evenements",
    "producteurs",
    "restaurant_crm",
    "menus_degustation",
    "blocs_contenu",
]

# Une ligne est visible si elle appartient au locataire courant, OU si on est admin.
# NULLIF(..., '') : une GUC custom déjà utilisée puis relâchée revient à '' (pas
# NULL) sur une connexion réutilisée ; on transforme '' en NULL pour éviter que
# ''::uuid ne plante (piège classique du pool de connexions).
COND = (
    "(restaurant_id = NULLIF(current_setting('app.current_restaurant', true), '')::uuid "
    "OR current_setting('app.admin', true) = 'on')"
)


def main() -> None:
    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as c:
        for t in TABLES:
            c.execute(text(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY"))
            c.execute(text(f"DROP POLICY IF EXISTS tenant_isolation ON {t}"))
            c.execute(text(
                f"CREATE POLICY tenant_isolation ON {t} "
                f"USING {COND} WITH CHECK {COND}"
            ))
            print(f"  RLS activé + policy : {t}")
    print("[enable_rls] OK")


if __name__ == "__main__":
    main()
