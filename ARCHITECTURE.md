# Architecture — Tabla

Ce document décrit l'architecture du code de Tabla. Il s'inspire d'un
**playbook full-stack FastAPI + React en Vertical Slice** (issu d'une app de
gestion en production) et l'**adapte** au contexte de Tabla. Principe directeur :
réutiliser les **conventions et l'infrastructure**, jamais le métier d'un autre
projet.

> Statut : adoption **par étapes**. Ce qui est en place aujourd'hui est marqué
> ✅ ; ce qui est prévu plus tard (quand les surfaces Restaurateur/Admin
> arriveront) est marqué ⏳.

---

## 1. Principe — Vertical Slice Architecture (VSA)

Le code est organisé **par fonctionnalité** (slice verticale), pas par couche
technique. Des deux côtés (back et front).

Pourquoi VSA ici : le domaine de Convive est essentiellement de la **lecture
éditoriale** (carte, producteurs) sur un schéma stable — pas d'invariants
métier riches. Une Clean/Hexagonal Architecture ajouterait beaucoup de fichiers
pour zéro valeur. On garde simple.

**Règles :**
1. Une feature n'importe **jamais** une autre feature. Le partage passe par
   `shared/` (front) ou par la couche modèles (back).
2. La couche **modèles de données** est la seule couche partagée du back.
3. Un fichier de logique métier n'est créé dans une feature **que** si elle a
   une vraie logique (calcul, cascade) — jamais d'abstraction préventive.

---

## 2. Structure du backend (`apps/api-python`) ✅

```
app/
├── main.py                         # app FastAPI : /health + montage des routers
├── core/                           # TRANSVERSE
│   ├── config.py                   # config Pydantic (lit .env, URL Azure)
│   └── db.py                       # engine (pool) + get_session
├── db/models/                      # modèles ORM — 1 fichier par table (couche partagée)
│   ├── plat.py                     # table dishes
│   ├── restaurant.py               # table restaurants
│   └── producteur.py               # table producers
└── modules/                        # les SLICES, par domaine
    └── carte/
        ├── module.py               # agrège les routers du domaine
        └── features/
            └── menu/
                ├── router.py       # GET /restaurants/{slug}/menu
                └── schemas.py      # DTO de sortie (alias camelCase)
```

Le domaine `carte` est monté sous **`/api/v1`** dans `main.py`.

---

## 3. Structure du frontend (`apps/convive`) ✅

```
src/
├── main.tsx                        # entrée (providers React Query)
├── app/
│   └── App.tsx                     # COQUILLE : thème, bascule d'écran, appel de données
├── shared/
│   └── menu/                       # donnée partagée (un seul appel API)
│       ├── api.ts                  # fetchMenu + types
│       └── queries.ts              # hook useMenu (cache TanStack Query)
└── features/                       # les SLICES (miroir du back)
    ├── carte/
    │   └── CartePage.tsx           # onglets catégories + liste de plats
    └── producteurs/
        ├── ProducteursPage.tsx     # annuaire (grille)
        └── FicheProducteur.tsx     # fiche détaillée (feuille modale)
```

La coquille fait **un seul** appel (`useMenu`) et passe les données aux features
en props → pas d'appel dupliqué, pas de feature qui en importe une autre.

---

## 4. Symétrie back ↔ front

Le domaine back `carte` correspond aux features front `carte` / `producteurs`
(deux vues sur la même donnée `menu`). Le code reste navigable : « où est la
carte ? » → `modules/carte` côté back, `features/carte` côté front.

---

## 5. Conventions

| Sujet | Choix Tabla |
|---|---|
| **Nommage base** | Greenfield → `snake_case`, tables au pluriel (`dishes`, `producers`). Modèles Python en français (`Plat`, `Producteur`), reliés à la table via `__tablename__` (renommage physique FR prévu unité 5). |
| **Séparation ORM / API** | Le modèle ORM garde les noms de la base (`photo_url`) ; le DTO expose des noms propres via **alias Pydantic** camelCase (`photoUrl`). Le client ne voit jamais le schéma physique. |
| **API** | Préfixe versionné **`/api/v1`**. |
| **Erreurs** | Codes HTTP explicites (`404` restaurant inconnu), jamais de 500 masquant une règle. |
| **Config** | Variables d'environnement (`.env`), jamais commitées. `.env.example` documente les clés. |

---

## 6. Adopté maintenant vs différé

| Brique | Statut | Note |
|---|---|---|
| Vertical Slice (back + front) | ✅ | en place |
| `core/` config + db | ✅ | |
| DTO à alias camelCase | ✅ | |
| API `/api/v1` | ✅ | |
| `.env.example` + secrets hors git | ✅ | |
| PWA (manifest + service worker) | ✅ | installable, cache hors-ligne |
| **Auth JWT + Argon2id** | ✅ | Convive **anonyme** (RGPD by design) ; JWT sur Restaurateur/Admin |
| **Gardes d'accès** (`require_admin`, `get_owned_restaurant`) + **RLS Postgres** | ✅ | isolation multi-tenant à deux niveaux |
| **Audit** des écritures | ⏳ | journalisation immuable à venir |
| **Observabilité / rate limiting** | ⏳ | production |
| **Tests + garde-fous CI** | ✅ | back (unitaires + intégration) + front (Vitest), **bloquants en CI** |
| **Migrations numérotées** | ⏳ | schéma en Python/SQLModel (`init_db`) ; migrations versionnées à venir |

> Règle de trois : on n'abstrait (librairies partagées, template) qu'une fois le
> motif prouvé sur plusieurs projets. Pas d'infrastructure préventive.

---

## 7. Chaîne technique actuelle

```
Azure Postgres (tabla_dev1)
   └─ API FastAPI (Python, /api/v1, port 8010)
        └─ proxy Vite (/api → 8010)
             └─ PWA React (Convive, port 5173 dev · 4173 preview)
```

L'ancienne API Node (`apps/api`, port 3001) est conservée comme **référence de
parité**, à supprimer une fois la migration terminée (unité 5).
