"""
app/db/models/ — les modèles ORM (SQLModel). 1 fichier par table.

C'est la SEULE couche partagée du back (on ne peut pas dupliquer les tables).
Ce __init__ réexporte les modèles pour des imports courts :
    from app.db.models import Plat, Restaurant, Producteur, PuceNfc, Table, Evenement
"""

from .accord import Accord
from .bloc_contenu import BlocContenu
from .composition import CompositionPlat
from .detail_vin import DetailVin
from .evenement import Evenement
from .menu_degustation import MenuDegustation
from .plat import Plat
from .producteur import Producteur
from .puce import PuceNfc
from .restaurant import Restaurant
from .restaurant_crm import RestaurantCrm
from .table import Table
from .utilisateur import Utilisateur
from .zone import Zone

__all__ = [
    "Accord",
    "BlocContenu",
    "CompositionPlat",
    "DetailVin",
    "Evenement",
    "MenuDegustation",
    "Plat",
    "Producteur",
    "PuceNfc",
    "Restaurant",
    "RestaurantCrm",
    "Table",
    "Utilisateur",
    "Zone",
]
