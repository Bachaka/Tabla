"""
tests/factories.py — fabriques d'entités pour les tests (Factory pattern).

Un test a besoin d'objets « plausibles » (un plat, un producteur, une puce…).
Les construire à la main dans chaque test serait long et fragile : dès qu'une
colonne NOT NULL est ajoutée au modèle, TOUS les tests casseraient.

La parade = une **fabrique** par entité. Elle fournit des valeurs par défaut
valides, et le test ne précise QUE ce qui l'intéresse (le reste est du décor) :

    p = plat(categorie="Vins", prix="42.00")   # les autres champs : défauts

C'est le motif « Object Mother / Factory » : centraliser la fabrication d'objets
de test pour que les tests restent courts et lisibles.

⚠️ Ces fabriques créent des objets ORM EN MÉMOIRE (jamais de base) : on ne fait
pas `session.add`, on instancie juste la classe SQLModel. Comme nos modèles ont
`table=True`, SQLModel ne valide pas à la construction — on peut donc passer
tous les champs directement.
"""

import uuid
from decimal import Decimal

from app.db.models import (
    CompositionPlat,
    Evenement,
    Plat,
    Producteur,
    PuceNfc,
    Restaurant,
    Table,
)

# UUID fixe et lisible du restaurant de démo : partagé par défaut entre les
# fabriques, pour que plats/producteurs/puces appartiennent au MÊME restaurant
# sans avoir à répéter l'id dans chaque test.
RESTO_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def restaurant(**over) -> Restaurant:
    """Un restaurant valide (Maison Salice par défaut). `over` écrase un champ."""
    champs = dict(
        id=RESTO_ID,
        slug="maison-salice",
        nom="Maison Salice",
        ville="Saint-Rémy-de-Provence",
        latitude=43.7886,
        longitude=4.8317,
        langues=["fr"],
    )
    champs.update(over)
    return Restaurant(**champs)


def plat(**over) -> Plat:
    """Un plat valide. Ex. `plat(categorie="Vins", signature=True)`."""
    champs = dict(
        id=uuid.uuid4(),
        restaurant_id=RESTO_ID,
        code="PLA-001",
        categorie="Plats",
        prix=Decimal("24.00"),
        signature=False,
        disponible=True,
        service=None,
        url_photo=None,
        nom={"fr": "Agneau des Alpilles"},
        resume={"fr": "Mijoté sept heures."},
        description={"fr": "Épaule confite, jus au thym."},
        regimes=[],
        allergenes=[],
    )
    champs.update(over)
    return Plat(**champs)


def producteur(**over) -> Producteur:
    """Un producteur valide (Léa d'Eygalières par défaut)."""
    champs = dict(
        id=uuid.uuid4(),
        restaurant_id=RESTO_ID,
        code="PRO-001",
        prenom="Léa",
        atelier="Jardins d'Eygalières",
        village="Eygalières",
        km=10,
        cap=90,
        latitude=43.7614,
        longitude=4.9494,
        url_portrait=None,
        url_atelier=None,
        role={"fr": "Maraîchère"},
        histoire={"fr": "Cultive en agroécologie."},
        labels=["Bio"],
        saison=["été"],
    )
    champs.update(over)
    return Producteur(**champs)


def composition(plat_id: uuid.UUID, **over) -> CompositionPlat:
    """Un ingrédient de composition, rattaché à `plat_id`."""
    champs = dict(
        plat_id=plat_id,
        producteur_id=None,
        position=0,
        libelle={"fr": "Tomates anciennes"},
    )
    champs.update(over)
    return CompositionPlat(**champs)


def puce(**over) -> PuceNfc:
    """Une puce NFC valide (appairée, cible menu par défaut)."""
    champs = dict(
        id=uuid.uuid4(),
        uid="04:A1:B2:C3:D4:E5:F6",
        restaurant_id=RESTO_ID,
        table_id=None,
        statut="appairee",
        cible={"kind": "menu"},
    )
    champs.update(over)
    return PuceNfc(**champs)


def table(**over) -> Table:
    """Une table de salle valide."""
    champs = dict(
        id=uuid.uuid4(),
        restaurant_id=RESTO_ID,
        libelle="07",
        zone_id=None,
    )
    champs.update(over)
    return Table(**champs)


def evenement(**over) -> Evenement:
    """Un événement d'engagement (tap du midi par défaut)."""
    champs = dict(
        restaurant_id=RESTO_ID,
        table_id=None,
        type="tap",
        service="midi",
    )
    champs.update(over)
    return Evenement(**champs)
