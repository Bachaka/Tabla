"""
Test unitaire de _service_courant (app/modules/nfc/features/tap/router.py).

La fonction dépend de l'HEURE (datetime.now) : elle bascule « midi » → « soir »
à 17h. Un test ne doit pas dépendre de l'heure réelle d'exécution. On utilise
donc `monkeypatch` pour REMPLACER l'horloge par une heure fixe, et vérifier les
deux branches de façon déterministe.
"""

from types import SimpleNamespace

import app.modules.nfc.features.tap.router as tap_router


def _figer_heure(monkeypatch, heure: int) -> None:
    """Remplace datetime.now() du module tap par une horloge bloquée à `heure`."""
    faux_datetime = SimpleNamespace(now=lambda: SimpleNamespace(hour=heure))
    monkeypatch.setattr(tap_router, "datetime", faux_datetime)


def test_avant_17h_c_est_midi(monkeypatch):
    _figer_heure(monkeypatch, 12)
    assert tap_router._service_courant() == "midi"


def test_a_17h_pile_c_est_le_soir(monkeypatch):
    _figer_heure(monkeypatch, 17)
    assert tap_router._service_courant() == "soir"


def test_en_soiree_c_est_le_soir(monkeypatch):
    _figer_heure(monkeypatch, 21)
    assert tap_router._service_courant() == "soir"
