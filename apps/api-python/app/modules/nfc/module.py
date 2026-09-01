"""module.py — agrège les features du domaine « nfc » (aujourd'hui : tap)."""

from fastapi import APIRouter

from .features.tap.router import router as tap_router

router = APIRouter()
router.include_router(tap_router)
