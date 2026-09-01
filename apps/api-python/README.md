# Tabla API — backend FastAPI (Python)

Backend **100 % Python** de Tabla (FastAPI). Sert les trois surfaces : Convive
(PWA), Restaurateur et Admin. La migration depuis l'ancien Node/Fastify est
terminée.

## Prérequis

- Python ≥ 3.12
- [`uv`](https://docs.astral.sh/uv/) (gestionnaire d'environnements et de paquets)
- Un accès à la base **Azure Postgres** (`tabla_dev1`).

## Configuration — le fichier `.env`

À créer dans `apps/api-python/.env` (jamais commité). Variables attendues :

```dotenv
# Base Azure — compte ADMIN/propriétaire (scripts, migrations)
AZURE_PG_HOST=...
AZURE_PG_PORT=5432
AZURE_PG_USER=...
AZURE_PG_PASSWORD=...
AZURE_PG_DATABASE=tabla_dev1
AZURE_PG_SSL=require

# Secret de signature des JWT (auth back-offices) — mettre une valeur aléatoire
JWT_SECRET=<chaîne aléatoire, ex. `python -c "import secrets;print(secrets.token_hex(32))"`>

# Compte applicatif runtime (soumis à RLS). ÉCRIT AUTOMATIQUEMENT par
# `setup_app_role` (voir plus bas) — ne pas remplir à la main.
# APP_PG_USER=tabla_app
# APP_PG_PASSWORD=...
```

> Si `APP_PG_*` est absent, l'API démarre quand même en retombant sur le compte
> admin (pratique en dépannage, **mais RLS est alors inactif**).

## Installation depuis zéro

Deux comptes de base sont utilisés : l'**admin** (crée/remplit, passe au-dessus
de RLS) pour les scripts, et **`tabla_app`** (soumis à RLS) pour l'API.

```bash
cd apps/api-python
uv sync                                     # crée .venv/ + installe les dépendances

uv run python -m app.scripts.init_db        # crée toutes les tables
uv run python -m app.scripts.seed           # données de démo (Maison Salice)
uv run python -m app.scripts.seed_users     # comptes de connexion (voir plus bas)
uv run python -m app.scripts.setup_app_role # crée le rôle tabla_app + écrit APP_PG_* dans .env
uv run python -m app.scripts.enable_rls     # active l'isolation multi-tenant (RLS)
```

> `disable_rls` éteint RLS (interrupteur de secours). Tous ces scripts sont
> **idempotents** : on peut les relancer sans risque.

## Démarrer

```bash
cd apps/api-python
uv run uvicorn app.main:app --reload --port 8010
```

- <http://localhost:8010/health> — endpoint de santé
- <http://localhost:8010/docs> — **doc interactive** (Swagger UI), générée
  automatiquement à partir du code.

## Comptes de démo (back-offices)

Créés par `seed_users`. **Mots de passe de démo uniquement.**

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@tabla.test` | `admin1234` |
| Restaurateur | `gerant@maison-salice.test` | `resto1234` |

## Sécurité

- **Authentification** : mots de passe hachés en **Argon2id** ; sessions par
  **JWT signés** (`/auth/login`, `/auth/me`). Les endpoints back-office sont
  protégés par des dépendances (`require_admin`, `get_owned_restaurant`). La
  Convive reste **anonyme** (RGPD by design).
- **Isolation multi-tenant (RLS)** : PostgreSQL filtre lui-même les lignes par
  restaurant (2ᵉ ligne de défense, même en cas de bug applicatif). Le « locataire
  courant » est posé par requête (`app/core/tenant.py`) ; les policies vivent
  dans `app/scripts/enable_rls.py`. Nécessite le compte `tabla_app` (sans
  `BYPASSRLS`).

## Architecture (rappel)

Slices verticales : `app/core/` (transverse) + `app/db/models/` (ORM SQLModel,
1 fichier/table) + `app/shared/` + `app/modules/<domaine>/features/<feature>/`
(`router.py` + `schemas.py`). API versionnée sous `/api/v1`, résolution de tap
NFC sous `/t/{uid}`.
