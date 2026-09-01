"""
Tests d'INTÉGRATION de carte/menu — frappent la base Azure de dev (données réelles).

Marqués `integration` : exclus par défaut, lancés avec `uv run pytest -m integration`.
Ils vérifient le contrat de bout en bout (app + base + données seedées).
"""

import pytest

pytestmark = pytest.mark.integration


def test_menu_ok(client):
    r = client.get("/api/v1/restaurants/maison-salice/menu")
    assert r.status_code == 200
    data = r.json()
    assert data["restaurant"]["slug"] == "maison-salice"
    assert len(data["plats"]) == 12
    assert len(data["producteurs"]) == 4


def test_menu_expose_le_camelcase(client):
    """Contrat du front : les clés sont en camelCase (urlPhoto, pas url_photo)."""
    r = client.get("/api/v1/restaurants/maison-salice/menu")
    dish = r.json()["plats"][0]
    assert "urlPhoto" in dish
    assert "url_photo" not in dish


def test_menu_restaurant_inconnu_404(client):
    r = client.get("/api/v1/restaurants/restaurant-qui-nexiste-pas/menu")
    assert r.status_code == 404
    assert r.json()["detail"] == "unknown_restaurant"
