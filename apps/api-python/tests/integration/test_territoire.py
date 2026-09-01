"""
Tests d'INTÉGRATION de la recherche spatiale (PostGIS : ST_DWithin) — base Azure.

Marqués `integration` (exclus par défaut). Nécessitent l'extension PostGIS et les
producteurs géocodés dans la base de dev.
"""

import pytest

pytestmark = pytest.mark.integration


def test_producteurs_proches_ordonnes_par_distance(client):
    r = client.get("/api/v1/restaurants/maison-salice/producteurs-proches?rayon_km=50")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3
    # PostGIS renvoie du plus proche au plus loin (opérateur KNN <->).
    distances = [p["distanceKm"] for p in data]
    assert distances == sorted(distances)


def test_producteurs_proches_petit_rayon_vide(client):
    # Le producteur le plus proche est à ~8 km : un rayon de 5 km ne renvoie rien.
    r = client.get("/api/v1/restaurants/maison-salice/producteurs-proches?rayon_km=5")
    assert r.status_code == 200
    assert r.json() == []


def test_producteurs_proches_restaurant_inconnu_404(client):
    r = client.get("/api/v1/restaurants/inconnu/producteurs-proches")
    assert r.status_code == 404
