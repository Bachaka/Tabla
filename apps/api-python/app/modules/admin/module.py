"""module.py — agrège les features du domaine « admin » (parc NFC…)."""

from fastapi import APIRouter

from .features.parc.router import router as parc_router
from .features.restaurants.router import router as restaurants_router

router = APIRouter()
router.include_router(parc_router)
router.include_router(restaurants_router)
