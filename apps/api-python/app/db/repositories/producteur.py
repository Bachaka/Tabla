"""Repository de l'entité Producteur (dont la requête spatiale PostGIS)."""

import uuid
from collections.abc import Sequence

from sqlalchemy import text
from sqlmodel import select

from app.db.models import Producteur

from .base import Repository


class ProducteurRepository(Repository):
    def lister_par_restaurant(self, restaurant_id: uuid.UUID) -> list[Producteur]:
        """Les producteurs d'un restaurant, du plus proche au plus loin."""
        return self.session.exec(
            select(Producteur)
            .where(Producteur.restaurant_id == restaurant_id)
            .order_by(Producteur.km)
        ).all()

    def lister_proches(self, restaurant_id: uuid.UUID, rayon_km: float) -> Sequence:
        """Producteurs à moins de `rayon_km`, triés par proximité (PostGIS).

        Le Repository CACHE le fait que c'est du SQL spatial : le routeur ne voit
        qu'un « donne-moi les producteurs proches ». `ST_DWithin` filtre via
        l'index GiST, `ST_Distance` calcule, l'opérateur KNN `<->` ordonne.
        Renvoie des lignes (id, prenom, atelier, village, distance_km).
        """
        return self.session.execute(
            text(
                """
                SELECT p.id, p.prenom, p.atelier, p.village,
                       ROUND((ST_Distance(p.geo, r.geo) / 1000)::numeric, 1) AS distance_km
                FROM producteurs p, restaurants r
                WHERE r.id = :rid
                  AND p.restaurant_id = :rid
                  AND p.geo IS NOT NULL
                  AND ST_DWithin(p.geo, r.geo, :rayon_m)
                ORDER BY p.geo <-> r.geo
                """
            ),
            {"rid": restaurant_id, "rayon_m": rayon_km * 1000},
        ).all()
