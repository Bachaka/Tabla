"""app/scripts/ — utilitaires en ligne de commande (création de schéma, seed).

Ces scripts ne font PAS partie de l'API HTTP : on les lance à la main pour
préparer une base (nouvelle machine, nouvelle base, CI). Ils remplacent le
schéma Drizzle + le seed de l'ancien projet Node (apps/api).

    uv run python -m app.scripts.init_db      # crée toutes les tables
    uv run python -m app.scripts.seed         # charge les données de démo
    uv run python -m app.scripts.export_data  # (dev) régénère seed_data.json
"""
