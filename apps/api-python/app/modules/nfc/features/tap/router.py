"""
router.py — résolution de tap NFC : GET /t/{uid}.

La puce ne porte qu'un identifiant OPAQUE ({uid}). Ici, le serveur le traduit
en contexte (restaurant, table, service, cible) ET enregistre le tap comme
événement anonyme. Accès aux données via les Repositories.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.core.tenant import set_tenant
from app.db.models import Evenement
from app.db.repositories import Repositories, get_repositories

from .schemas import TapOut

router = APIRouter(tags=["nfc"])


def _service_courant() -> str:
    """Service selon l'heure : bascule à 17h."""
    return "soir" if datetime.now().hour >= 17 else "midi"


@router.get("/{uid}", response_model=TapOut)
def resoudre_tap(uid: str, repos: Repositories = Depends(get_repositories)) -> TapOut:
    # 1. Retrouver la puce par son uid opaque.
    puce = repos.puces.get_par_uid(uid)
    if puce is None or puce.statut == "desactivee" or puce.restaurant_id is None:
        raise HTTPException(status_code=404, detail="unknown_tag")

    # 2. Le restaurant ciblé.
    resto = repos.restaurants.get(puce.restaurant_id)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    set_tenant(repos.session, resto.id)  # RLS : table + écriture scopées

    # 3. La table (si la puce en désigne une) + le service courant.
    table = repos.tables.get(puce.table_id) if puce.table_id else None
    service = _service_courant()

    # 4. ÉCRITURE : le tap comme événement ANONYME (attribué à la table). Le
    #    Repository stage la ligne ; le Unit of Work valide.
    repos.evenements.ajouter(
        Evenement(
            restaurant_id=resto.id,
            table_id=puce.table_id,
            type="tap",
            service=service,
        )
    )
    repos.commit()

    # 5. Contexte résolu (le front sait alors quoi afficher).
    return TapOut(
        restaurant=resto,
        table=table,
        service=service,
        cible=puce.cible,
        lang="fr",
    )
