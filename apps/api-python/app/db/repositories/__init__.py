"""
app/db/repositories — la couche d'accès aux données (pattern **Repository**).

Chaque entité métier a un Repository qui encapsule ses requêtes ; les routers
passent par lui au lieu d'écrire du SQL (`select`, jointures, noms de colonnes).
Bénéfices : requêtes écrites une seule fois (dédup), persistance découplée,
routers lisibles et testables (on peut simuler un Repository).

`Repositories` regroupe l'ensemble sur UNE même session (pattern **Unit of
Work**) et s'injecte en une seule dépendance FastAPI. Discipline transactionnelle :
les repositories STAGENT les écritures (`ajouter`/`supprimer`, sans committer) ;
c'est le Unit of Work qui VALIDE (`repos.commit()`) — une seule transaction,
même pour des écritures multi-entités.

    def endpoint(repos: Repositories = Depends(get_repositories)):
        resto = repos.restaurants.get_par_slug(slug)
        repos.plats.ajouter(nouveau_plat)
        repos.commit()
"""

from fastapi import Depends
from sqlmodel import Session

from app.core.db import get_session

from .composition import CompositionRepository
from .evenement import EvenementRepository
from .plat import PlatRepository
from .producteur import ProducteurRepository
from .puce import PuceRepository
from .restaurant import RestaurantRepository
from .restaurant_crm import RestaurantCrmRepository
from .table import TableRepository
from .utilisateur import UtilisateurRepository
from .zone import ZoneRepository

__all__ = [
    "CompositionRepository",
    "EvenementRepository",
    "PlatRepository",
    "ProducteurRepository",
    "PuceRepository",
    "RestaurantCrmRepository",
    "RestaurantRepository",
    "TableRepository",
    "UtilisateurRepository",
    "ZoneRepository",
    "Repositories",
    "get_repositories",
]


class Repositories:
    """Regroupe tous les repositories sur la session de la requête (Unit of Work)."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.restaurants = RestaurantRepository(session)
        self.restaurant_crm = RestaurantCrmRepository(session)
        self.plats = PlatRepository(session)
        self.producteurs = ProducteurRepository(session)
        self.compositions = CompositionRepository(session)
        self.puces = PuceRepository(session)
        self.tables = TableRepository(session)
        self.zones = ZoneRepository(session)
        self.evenements = EvenementRepository(session)
        self.utilisateurs = UtilisateurRepository(session)

    def commit(self) -> None:
        """Valide la transaction (les écritures stagées par les repositories)."""
        self.session.commit()


def get_repositories(session: Session = Depends(get_session)) -> Repositories:
    """Dépendance FastAPI : fournit les repositories, adossés à la session HTTP."""
    return Repositories(session)
