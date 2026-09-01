# Fiche de révision — concepts expliqués (Tabla)

> Index des notions abordées pendant le développement, avec l'essentiel de
> chacune. Pour une explication complète d'un point, redemande-le à l'assistant
> (« ré-explique X en détail »). Le code de référence est indiqué entre `code`.

---

## 1. Web & outillage front

- **Navigateur** : ne comprend que **HTML / CSS / JavaScript de base**. Tout le
  reste (TypeScript, JSX) doit être **traduit**.
- **Vite** : l'outil de build des fronts. En **dev**, serveur ultra-rapide (il
  traduit les fichiers *à la demande* via les modules ES natifs, + rechargement
  à chaud HMR + proxy `/api` → API). En **prod**, il **bundle** (emballe tout en
  un fichier) et minifie → `dist/`. Moteurs internes : **esbuild** (rapide) +
  **Rollup** (bundle final).
- **Bundle** = coller les centaines de fichiers en un seul (moins d'appels réseau).
- **Noms hachés** (`index-D9DjXhpu.js`) : le code du nom vient du **contenu** →
  si le contenu change, le nom change → le navigateur re-télécharge ; sinon il
  réutilise son **cache**.
- **PWA** (Progressive Web App) : une appli web installable, sans passer par un
  store. La Convive en est une (`vite-plugin-pwa`).
- **Proxy / CORS** : en dev, le proxy Vite fait croire au navigateur que front et
  API sont sur la même origine (pas de CORS). En prod, ils sont sur des domaines
  différents → il faut **autoriser explicitement** les origines (CORS côté API).
- **Monorepo pnpm + turborepo** : plusieurs apps/paquets dans un seul dépôt, avec
  des dépendances partagées (`packages/design-system`, `packages/data`).

## 2. TypeScript, JSX, React

- **TypeScript** = JavaScript **+ des types**. Fichiers `.ts` (logique pure) ou
  `.tsx` (avec du JSX).
- **JSX** = écrire du **HTML dans du JavaScript**, avec des **accolades `{ }`**
  pour injecter variables/logique. Nuances : `className` (pas `class`), `{ }`,
  un seul élément racine. Ce n'est **pas** React : c'est traduit en appels React
  (`React.createElement`) par Vite.
- **React** = une **bibliothèque** (le moteur qui dessine l'écran et gère l'état).
  ≠ JSX (une notation) ≠ TypeScript (la langue). Les trois travaillent ensemble.
- **Composant** = une **fonction qui renvoie du JSX** = ta propre balise
  réutilisable (`<PlatCard/>`). Reçoit des **props** (ses entrées, comme des
  arguments). L'app entière = un **arbre de composants**.

## 3. Concepts React (dans le code)

- **`useState`** : mémoriser une valeur d'UI ; la changer **ré-affiche** le composant.
- **`useEffect`** : effet de bord (thème, synchro) ; `[]` = une fois au montage.
- **`useMemo`** : mémorise un calcul coûteux (filtres) ; recalcule si ses
  dépendances changent.
- **`useQuery`** (TanStack Query) : **lire** + mettre en cache des données serveur
  (clé + fonction). Encapsulé dans un hook = **ViewModel** (pattern MVVM).
- **`useMutation` + `invalidateQueries`** : **écrire** (POST/PUT/DELETE), puis
  marquer les données périmées → React Query **recharge** tout seul.
- **Context** (`SlugContext` + `useSlug`) : diffuser une valeur (le slug du resto)
  à tous les écrans sans la passer en prop à la main.
- **Barrière d'auth** : `App` est un rendu conditionnel sur une variable à 3 états
  (`undefined` = vérif / `null` = déconnecté / objet = connecté).
- **`authFetch`** : intercepteur qui ajoute le token à **toutes** les requêtes.

## 4. Backend Python (FastAPI)

- **FastAPI** ≠ **Fastify** ! FastAPI = Python (le back **actuel**) ; Fastify =
  Node (l'**ancien**, supprimé). Ne pas confondre à l'oral.
- **Pydantic** : valide et convertit les données ; génère la doc OpenAPI. Les
  **DTO** (`CamelModel`) traduisent snake_case (base) → camelCase (front).
- **Architecture en slices verticales (VSA)** : un dossier par domaine
  (`modules/<domaine>/features/<feature>/{router, schemas}`) → tout ce qui touche
  une fonctionnalité au même endroit.
- **Dépendances FastAPI** (`Depends`) : fonctions injectées **avant** l'endpoint
  (ex. `get_session`, `require_admin`). Peuvent bloquer la requête (401/403).
- **API versionnée** `/api/v1` ; tap NFC sous `/t/{uid}` (URL courte inscrite
  dans la puce).

## 5. ORM & base de données

- **ORM** = SQLModel (posé sur **SQLAlchemy**) : une **classe = une table**, un
  **attribut = une colonne**. Le **driver** psycopg parle réellement à Postgres.
- **SQL généré** : `select(Plat)` → `SELECT …`. Les valeurs voyagent en
  **paramètres** (`%(x)s`), jamais collées → anti-injection SQL.
- **Transactions** (`BEGIN … COMMIT/ROLLBACK`) : **atomicité** = tout ou rien.
  `session.add()` prépare, `commit()` valide, une erreur → `rollback` annule tout.
- **Isolation** (MVCC) : plusieurs requêtes simultanées ne se marchent pas dessus.
  Défaut PostgreSQL = *Read Committed* (pas de lecture sale ; deux écritures sur
  la même ligne se sérialisent).
- **Agrégations** : `func.count()` + `group_by()` + `order_by()`/`limit()`.
  Jointure **interne** (que les lignes qui matchent) vs **externe** (`isouter`,
  garde les restos à 0 tap).
- **jsonb** : stocker une liste/objet dans une colonne (ex. `name` localisé,
  `diets`). **Decimal** pour l'argent (jamais `float`).

## 6. Sécurité

- **Authentification** (« qui es-tu ? ») vs **Autorisation** (« as-tu le droit ? »).
- **Argon2id** : hachage **à sens unique** du mot de passe (jamais en clair).
- **JWT** : jeton **signé** (pas chiffré → lisible, jamais de secret dedans),
  contient identité + expiration ; infalsifiable grâce à `JWT_SECRET`.
- **Gardes** (`core/auth.py`) : `get_current_user` → `require_admin` /
  `get_owned_restaurant` (rôle + propriété du resto). S'empilent en chaîne.
- **RLS** (Row-Level Security PostgreSQL) : la **base** filtre les lignes par
  locataire — 2ᵉ serrure, même si le code se trompe. Image : un **videur** qui ne
  laisse sortir que les lignes du **badge** présenté (`set_config('app.current_restaurant')`).
  - Piège 1 : le compte admin a **BYPASSRLS** → il faut un compte applicatif
    dédié `tabla_app` (sans ce privilège).
  - Piège 2 : `NULLIF(…, '')` (une GUC relâchée revient à `''` sur une connexion
    réutilisée) ; et **niveau session** + `clear_tenant` (pool de connexions).

## 7. Fonctionnalités Tabla

- **Résolution de tap** (`/t/{uid}`) : la puce ne porte qu'un UID opaque ; le
  serveur le traduit en resto+table+service et écrit un **événement anonyme**
  (RGPD). L'URL de la puce = celle de la Convive avec `?t=<uid>`.
- **Appairage puce↔table** (Restaurateur) : bascule `provisioned ↔ paired`, règle
  « une puce par table ».
- **Lot de puces** (Admin) : INSERT en masse de N puces `provisioned`.
- **CRM restaurants** : un DTO qui **agrège** `restaurants` + `restaurant_crm` +
  compteurs dérivés.
- **CRUD** ↔ **HTTP** ↔ **SQL** : Create/POST/INSERT · Read/GET/SELECT ·
  Update/PUT/UPDATE · Delete/DELETE/DELETE. Règles métier = garde-fous (409).

## 8. Déploiement Azure

- **Topologie** : 1 **App Service** (API FastAPI) + 3 **Static Web Apps** (fronts)
  + **Postgres**. Voir `DEPLOY.md`.
- **CI/CD** : 2 pipelines Azure DevOps (`pipelines/api.yml`, `pipelines/fronts.yml`).
  L'API s'authentifie via une **service connection** ; les fronts via des
  **deployment tokens** (un par SWA).
- **`VITE_API_URL`** : injectée au build → URL absolue de l'API en prod
  (relatif en dev). **`ALLOWED_ORIGINS`** : les 3 URLs SWA, pour le CORS.
- **App Service Python** : Oryx installe depuis `requirements.txt` ; startup
  command `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`.

## 9. Lire le code (parcours établis)

**Back** : 1. fondations (`core/`, `db/models/`) · 2. entrée + lecture
(`main.py`, menu, tap) · 3. sécurité (JWT + RLS) · 4. CRUD + admin + analytique
SQL · 5. scripts. **Front** : 6. Convive · 7. Admin (auth + mutations) ·
8. Restaurateur (Context). Astuce : suivre **un fil** de bout en bout
(ex. « afficher la carte » : `Menu.tsx` → `useMenu` → `/menu` → `Plat` → base).
