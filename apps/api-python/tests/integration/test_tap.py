"""
Tests d'INTÉGRATION de la résolution de tap NFC (GET /t/{uid}) — base Azure réelle.

Marqués `integration` (exclus par défaut). Écrit un événement d'engagement sur
la base de dev (effet de bord assumé).
"""

import pytest
from sqlmodel import Session, select

from app.core.db import engine
from app.db.models import PuceNfc

pytestmark = pytest.mark.integration


def _un_uid_actif() -> str:
    """Récupère un uid de puce active dans la base (pour le test de résolution)."""
    with Session(engine) as s:
        return s.exec(
            select(PuceNfc.uid).where(PuceNfc.statut != "desactivee").limit(1)
        ).one()


def test_tap_puce_inconnue_404(client):
    r = client.get("/t/uid-qui-nexiste-pas")
    assert r.status_code == 404
    assert r.json()["detail"] == "unknown_tag"


def test_tap_resout_le_contexte(client):
    uid = _un_uid_actif()
    r = client.get(f"/t/{uid}")
    assert r.status_code == 200
    data = r.json()
    assert data["restaurant"]["slug"] == "maison-salice"
    assert data["service"] in ("midi", "soir")
