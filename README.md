# Tabla

Plateforme NFC pour la restauration : le convive **pose son téléphone sur une
puce NFC** intégrée à la table et accède, **sans installation**, à une carte
éditoriale qui raconte les plats, les producteurs et les saisons. Le restaurateur
pilote sa carte et sa salle depuis un back-office ; les équipes plateforme gèrent
le parc de puces et les restaurants clients depuis une console d'administration.

Trois surfaces partageant **un même design system, une même i18n et un même
modèle de données** — les trois **fonctionnelles et déployées sur Azure** :

| Surface | Cible | État |
|---|---|---|
| **Convive** (PWA mobile) | le client à table | fonctionnel · déployé |
| **Restaurateur** (web) | le gérant | fonctionnel · déployé |
| **Admin** (console) | équipe plateforme | fonctionnel · déployé |

> Restaurant de démonstration : **Maison Salice** (bistrot de Provence, fictif).

## En bref (choix techniques)

- **Frontend** — 3 applications **React 19 + TypeScript + Vite + Tailwind v4**
  (Convive en PWA), dans un **monorepo pnpm/turborepo** avec design system et
  types de domaine partagés.
- **Backend** — **FastAPI (Python 3.12)**, architecture en **modules verticaux**
  par domaine, API REST versionnée (`/api/v1`), documentation OpenAPI générée.
- **Données** — **PostgreSQL** (Azure), multi-tenant (`restaurant_id` partout),
  **Row-Level Security** active et **PostGIS** pour la géolocalisation.
- **Sécurité** — auth **JWT + Argon2id** + gardes applicatives, **et** RLS en
  base : deux lignes de défense. Parcours convive **anonyme** (RGPD by design).
- **Design patterns** — Repository + Unit of Work, DTO (Pydantic), Singleton,
  Decorator, MVVM (hooks React), Factory (tests + tokens).
- **Qualité** — tests **backend** (unitaires sans base + intégration) et
  **frontend** (Vitest + Testing Library), **bloquants en CI**.
- **Déploiement** — Azure App Service (API) + 3 Static Web Apps (fronts) +
  Postgres managé, CI/CD par pipelines Azure DevOps (voir `DEPLOY.md`).

---

## Structure du dépôt

```
Tabla/
├─ apps/
│  ├─ convive/        PWA Convive     — Vite + React 19 + TS + Tailwind v4
│  ├─ restaurant/     Back-office     — Vite + React 19 + TS
│  ├─ admin/          Console admin   — Vite + React 19 + TS
│  └─ api-python/     API backend     — FastAPI (Python) + SQLModel
├─ packages/
│  ├─ design-system/  tokens des thèmes (clair/sombre/contraste) + thème Tailwind
│  └─ data/           types TypeScript du domaine (partagés entre les fronts)
├─ pipelines/         CI/CD Azure DevOps (déploiement API + fronts)
├─ Docs/              cahiers des charges + spécifications fonctionnelles
├─ ARCHITECTURE.md    vue d'ensemble de l'architecture
├─ DEPLOY.md          procédure de déploiement Azure
└─ EXPLICATIONS.md    fiche de révision des concepts clés
```

Le repo est un **monorepo pnpm/turborepo** côté JavaScript (`apps/*` + `packages/*`),
et l'API Python (`apps/api-python`) est gérée à part avec **uv**.

---

## Prérequis

| Outil | Version | Rôle |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 22 | applications frontend |
| [pnpm](https://pnpm.io) | 9.15 (`corepack enable`) | gestion des paquets JS |
| [Python](https://python.org) | ≥ 3.12 | API FastAPI |
| [uv](https://docs.astral.sh/uv/) | récent | environnement + paquets Python |
| Accès **PostgreSQL** | 16+ | base `tabla_dev1` (identifiants dans `.env`) |

---

## Installation

```bash
# 1. Cloner
git clone https://github.com/Bachaka/Tabla.git
cd Tabla

# 2. Dépendances JavaScript (fronts + packages)
corepack enable
pnpm install

# 3. Dépendances Python (API FastAPI)
cd apps/api-python
uv sync
cd ../..

# 4. Secrets — NON versionnés : créer apps/api-python/.env
#    à partir de apps/api-python/.env.example
```

---

## Lancer en développement

| Service | Commande | URL |
|---|---|---|
| **API FastAPI** | `cd apps/api-python && uv run uvicorn app.main:app --reload --port 8010` | http://localhost:8010 · doc : `/docs` |
| **PWA Convive** | `pnpm --filter @tabla/convive dev` | http://localhost:5173 |
| **Restaurateur** | `pnpm --filter @tabla/restaurant dev` | http://localhost:5175 |
| **Admin** | `pnpm --filter @tabla/admin dev` | http://localhost:5176 |

---

## Base de données (PostgreSQL)

Recréer une base vierge, de bout en bout (depuis `apps/api-python`) :

```bash
cd apps/api-python
uv run python -m app.scripts.init_db         # schéma (tables SQLModel)
uv run python -m app.scripts.seed            # données de démo (Maison Salice)
uv run python -m app.scripts.seed_users      # comptes de démo
uv run python -m app.scripts.setup_app_role  # compte applicatif tabla_app
uv run python -m app.scripts.enable_rls      # policies Row-Level Security
```

> Les identifiants vivent dans `apps/api-python/.env` (**jamais** dans git).
> Format documenté dans `apps/api-python/.env.example`.

---

## Tests

```bash
# Backend — unitaires (sans base, rapides)
cd apps/api-python && uv run pytest
#   … et tests d'intégration (nécessitent la base) :
uv run pytest -m integration

# Frontend — Vitest + Testing Library
pnpm --filter @tabla/convive test
```

---

## Documentation

- **`ARCHITECTURE.md`** — architecture en couches, modules, patterns.
- **`DEPLOY.md`** — déploiement Azure (App Service, Static Web Apps, pipelines).
- **`EXPLICATIONS.md`** — fiche de révision des concepts (REST, RLS, PWA…).
- **`Docs/`** — cahiers des charges et spécifications fonctionnelles.
