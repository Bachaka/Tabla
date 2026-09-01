"""module.py — agrège les features du domaine « salle » (appairage puce↔table…)."""

from fastapi import APIRouter

from .features.appairage.router import router as appairage_router
from .features.tables.router import router as tables_router

router = APIRouter()
router.include_router(appairage_router)
router.include_router(tables_router)
