"""
module.py — agrège les routers des features du domaine « carte ».

Aujourd'hui une seule feature (menu). Quand d'autres arriveront (ex. tap NFC,
accords…), on les inclura ici, et main.py n'aura toujours qu'un seul router à
monter pour tout le domaine.
"""

from fastapi import APIRouter

from .features.menu.router import router as menu_router
from .features.territoire.router import router as territoire_router

router = APIRouter()
router.include_router(menu_router)
router.include_router(territoire_router)
