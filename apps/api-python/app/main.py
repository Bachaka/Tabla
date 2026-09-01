"""
app/main.py — point d'entrée de l'API Tabla (FastAPI).

Rôle réduit à l'essentiel (architecture par slices verticales) :
  - créer l'application,
  - exposer les endpoints transverses (/health),
  - MONTER les routers des modules métier.
La logique métier vit dans app/modules/<domaine>/features/, pas ici.

Lancer (depuis apps/api-python/) :
    uv run uvicorn app.main:app --reload --port 8010
Puis : http://localhost:8010/health  et  http://localhost:8010/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import admin_engine as engine
from app.db.models import Restaurant, RestaurantCrm
from app.modules.admin.module import router as admin_router
from app.modules.auth.module import router as auth_router
from app.modules.carte.module import router as carte_router
from app.modules.engagement.module import router as engagement_router
from app.modules.nfc.module import router as nfc_router
from app.modules.salle.module import router as salle_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage : crée la table restaurant_crm si absente (sans toucher les
    # autres tables) et seed la ligne CRM de Maison Salice (valeurs fabriquées).
    RestaurantCrm.__table__.create(engine, checkfirst=True)
    with Session(engine) as s:
        resto = s.exec(select(Restaurant).where(Restaurant.slug == "maison-salice")).first()
        if resto is not None and s.get(RestaurantCrm, resto.id) is None:
            s.add(
                RestaurantCrm(
                    restaurant_id=resto.id,
                    forfait="Pro",
                    score_sante=82,
                    mrr=890,
                    statut_facturation="active",
                    note=4.7,
                )
            )
            s.commit()
    yield


app = FastAPI(title="Tabla API", version="0.1.0", lifespan=lifespan)

# CORS : en prod, les 3 fronts sont sur d'autres domaines (Static Web Apps) et
# doivent être explicitement autorisés. En dev, ALLOWED_ORIGINS est vide (même
# origine via le proxy Vite) → on n'ajoute pas le middleware.
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],  # dont Authorization (Bearer)
    )


class Health(BaseModel):
    ok: bool
    service: str


@app.get("/health", response_model=Health)
async def health() -> Health:
    """Endpoint de santé (transverse)."""
    return Health(ok=True, service="tabla-api")


# ── Montage des modules métier ─────────────────────────────────────────
# API versionnée (playbook §4) : toutes les routes métier sous /api/v1.
# Le domaine « carte » expose GET /api/v1/restaurants/{slug}/menu.
app.include_router(auth_router, prefix="/api/v1")
app.include_router(carte_router, prefix="/api/v1")
app.include_router(engagement_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(salle_router, prefix="/api/v1")

# Résolution de tap NFC : URL COURTE /t/{uid} (c'est ce qui est écrit dans la
# puce), donc hors du préfixe /api/v1.
app.include_router(nfc_router, prefix="/t")
