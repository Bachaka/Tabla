"""module.py — agrège les features du domaine « engagement » (events, stats…)."""

from fastapi import APIRouter

from .features.events.router import router as events_router
from .features.stats.router import router as stats_router

router = APIRouter()
router.include_router(events_router)
router.include_router(stats_router)
