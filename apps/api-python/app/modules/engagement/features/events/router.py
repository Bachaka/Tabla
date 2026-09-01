"""
router.py — enregistrement d'événements d'engagement : POST /events.

Le front appelle cette route quand le convive REGARDE quelque chose (ouvre une
fiche plat/producteur). Anonyme (attribué à la table). Accès via Repositories.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.core.tenant import set_tenant
from app.db.models import Evenement
from app.db.repositories import Repositories, get_repositories

from .schemas import EventIn

router = APIRouter(tags=["engagement"])

# Types d'événements autorisés (mêmes valeurs que la colonne en base).
TYPES_AUTORISES = {
    "tap",
    "retap",
    "vue_plat",
    "vue_producteur",
    "appel_serveur",
    "demande_addition",
    "ajout_selection",
}


@router.post("/events", status_code=201)
def enregistrer_evenement(
    payload: EventIn, repos: Repositories = Depends(get_repositories)
) -> dict[str, bool]:
    # Garde-fou : type connu.
    if payload.type not in TYPES_AUTORISES:
        raise HTTPException(status_code=422, detail="unknown_event_type")

    # Résoudre le restaurant par slug.
    resto = repos.restaurants.get_par_slug(payload.slug)
    if resto is None:
        raise HTTPException(status_code=404, detail="unknown_restaurant")
    set_tenant(repos.session, resto.id)  # RLS : l'écriture est scopée

    service = "soir" if datetime.now().hour >= 17 else "midi"

    # Écriture anonyme (sujet_id = ce qui est regardé ; jamais une personne).
    repos.evenements.ajouter(
        Evenement(
            restaurant_id=resto.id,
            table_id=payload.table_id,
            type=payload.type,
            sujet_id=payload.sujet_id,
            service=service,
        )
    )
    repos.commit()
    return {"ok": True}
