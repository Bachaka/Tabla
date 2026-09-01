"""
app/shared/geo.py — utilitaires géographiques transverses.

haversine_km : distance « à vol d'oiseau » entre deux points (lat/long), en km.

La formule de Haversine calcule la distance orthodromique (le plus court chemin
à la surface d'une sphère) à partir des latitudes/longitudes. On modélise la
Terre par une sphère de rayon 6371 km (approximation suffisante ici : l'erreur
est < 0,5 %). C'est ce que le cahier des charges NSY209 demande (§4.2.5) pour
afficher la distance restaurant ↔ producteur.
"""

from math import asin, cos, radians, sin, sqrt

RAYON_TERRE_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance en km entre (lat1,lon1) et (lat2,lon2). Angles en degrés."""
    # radians() convertit les degrés en radians (les fonctions trigo attendent des radians).
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    # a = carré de la moitié de la corde entre les deux points (formule de Haversine).
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    # 2·asin(√a) = l'angle central ; × rayon = la distance sur la sphère.
    return 2 * RAYON_TERRE_KM * asin(sqrt(a))
