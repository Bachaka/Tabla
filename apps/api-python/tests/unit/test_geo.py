"""
Tests unitaires de app/shared/geo.py (formule de Haversine).

Une fonction PURE (mêmes entrées → même sortie, aucun effet de bord) est le cas
idéal du test unitaire : on l'appelle directement, on vérifie le résultat. Pas
de base, pas de HTTP, pas de mock. Ces tests s'exécutent en millisecondes.
"""

from app.shared.geo import haversine_km


def test_distance_saint_remy_eygalieres():
    """Maison Salice (Saint-Rémy) ↔ Léa (Eygalières) ≈ 10 km (donnée de démo)."""
    d = haversine_km(43.7886, 4.8317, 43.7614, 4.9494)
    assert 9 < d < 11


def test_distance_nulle_meme_point():
    """Deux fois le même point → distance 0."""
    d = haversine_km(43.7886, 4.8317, 43.7886, 4.8317)
    assert d == 0


def test_symetrie_a_vers_b_egal_b_vers_a():
    """La distance A→B est la même que B→A (la formule est symétrique)."""
    aller = haversine_km(43.78, 4.83, 44.05, 5.17)
    retour = haversine_km(44.05, 5.17, 43.78, 4.83)
    assert abs(aller - retour) < 1e-9


def test_un_degre_de_latitude_vaut_environ_111km():
    """Repère physique : 1° de latitude ≈ 111 km partout sur le globe."""
    d = haversine_km(43.0, 4.0, 44.0, 4.0)
    assert 110 < d < 112
