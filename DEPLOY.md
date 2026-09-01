# Déploiement Azure (Azure DevOps Pipelines)

Cible : **1 App Service** (API FastAPI) + **3 Static Web Apps** (fronts), tout
sur la base Postgres `tabla_dev1` déjà en place.

| Composant | Ressource | URL |
|---|---|---|
| API | App Service (France Central) | https://app-tabla-dev-crb8cedmgpedddeh.francecentral-01.azurewebsites.net |
| Convive (client) | Static Web App | https://white-meadow-0e51e0103.7.azurestaticapps.net |
| Admin | Static Web App | https://blue-smoke-03e0d7703.7.azurestaticapps.net |
| Restaurateur | Static Web App | https://kind-wave-03421c203.7.azurestaticapps.net |

---

## 1. Service connection (une fois)

Azure DevOps → **Project settings → Service connections → New → Azure Resource
Manager** → autorise ton abonnement. Note son **nom** et reporte-le dans
`pipelines/api.yml` (`AZURE_SERVICE_CONNECTION`).

## 2. App Service — configuration

Portail → l'App Service → **Configuration → Application settings**, ajouter :

```
AZURE_PG_HOST=<ton host Postgres>
AZURE_PG_PORT=5432
AZURE_PG_USER=<user admin Postgres>
AZURE_PG_PASSWORD=<mot de passe admin>
AZURE_PG_DATABASE=tabla_dev1
AZURE_PG_SSL=require
JWT_SECRET=<le même que ton .env local, ou une nouvelle valeur aléatoire>
APP_PG_USER=tabla_app
APP_PG_PASSWORD=<le APP_PG_PASSWORD de ton .env local>
ALLOWED_ORIGINS=https://white-meadow-0e51e0103.7.azurestaticapps.net,https://blue-smoke-03e0d7703.7.azurestaticapps.net,https://kind-wave-03421c203.7.azurestaticapps.net
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

Puis **Configuration → General settings → Startup Command** :

```
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Vérifier aussi le **nom exact** de la ressource App Service (Overview) et le
reporter dans `pipelines/api.yml` (`API_APP_NAME`).

> ⚠️ Ne remets PAS `JWT_SECRET`/mots de passe dans git. Ils vivent uniquement
> ici (Application settings) et dans ton `.env` local.

## 3. Pare-feu Postgres

Serveur Postgres → **Networking** → activer **« Allow public access from Azure
services »** (ou une règle VNet) pour que l'App Service puisse se connecter.

## 4. Pipeline API

Pipelines → **New pipeline → Azure Repos Git →** ton repo **→ Existing YAML
file → `/pipelines/api.yml`** → Run. Il déploie `apps/api-python` sur l'App
Service (Oryx installe `requirements.txt`, puis lance uvicorn).

## 5. Pipeline fronts

D'abord récupérer les **3 jetons de déploiement** : pour chaque Static Web App,
portail → la SWA → **Manage deployment token** → copier.

Créer le pipeline (`/pipelines/fronts.yml`), puis **Edit → Variables** → ajouter
3 variables **secrètes** :

```
SWA_TOKEN_CONVIVE     = <token de white-meadow>
SWA_TOKEN_ADMIN       = <token de blue-smoke>
SWA_TOKEN_RESTAURANT  = <token de kind-wave>
```

Run. Il builde les 3 fronts (avec `VITE_API_URL` pointant sur l'API) et les
déploie sur leurs SWA respectives.

## 6. Vérification bout en bout

1. Ouvrir chaque front (URLs ci-dessus).
2. **Admin** / **Restaurateur** : se connecter (`admin@tabla.test` / `admin1234`,
   `gerant@maison-salice.test` / `resto1234`).
3. **Convive** : ouvrir `https://white-meadow-...azurestaticapps.net/?t=<uid>`
   avec un uid de puce valide → la carte doit s'afficher.
4. En cas d'erreur CORS dans la console du navigateur : revérifier
   `ALLOWED_ORIGINS` (exactement les 3 URLs, sans slash final).

---

## Notes

- La **base est partagée** avec le dev (`tabla_dev1`) : rien à réinstaller. Le
  compte `tabla_app` et RLS y sont déjà actifs.
- Pour une **vraie** prod, prévoir une base séparée + secrets dédiés (Key Vault).
- Le tier **Free** des SWA suffit ; App Service **B1** conseillé (le F1 s'endort).
