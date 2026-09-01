"""module.py — agrège les features du domaine « auth » (session…)."""

from fastapi import APIRouter

from .features.session.router import router as session_router

router = APIRouter()
router.include_router(session_router)
