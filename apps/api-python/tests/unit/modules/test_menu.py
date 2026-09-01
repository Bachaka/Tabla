"""
Tests unitaires de l'endpoint GET /api/v1/restaurants/{slug}/menu.

Ici on teste l'ENDPOINT (routage, 404, assemblage du DTO, camelCase) mais SANS
base : on injecte un FakeRepositories rempli par les fabriques. L'endpoint croit
parler à la vraie couche d'accès données.
"""

from tests.factories import composition, plat, producteur, restaurant
from tests.fakes import FakeRepositories

MENU = "/api/v1/restaurants/maison-salice/menu"


def test_menu_404_si_restaurant_inconnu(client_avec_repos):
    """Aucun restaurant dans le fake → l'endpoint répond 404 unknown_restaurant."""
    c = client_avec_repos(FakeRepositories(restaurant=None))
    r = c.get("/api/v1/restaurants/inexistant/menu")
    assert r.status_code == 404
    assert r.json()["detail"] == "unknown_restaurant"


def test_menu_ok_structure_et_camelcase(client_avec_repos):
    """Un plat + un producteur → 200, et les clés JSON sont en camelCase."""
    p = plat(nom={"fr": "Agneau"}, url_photo="/img/agneau.jpg")
    faux = FakeRepositories(
        restaurant=restaurant(),
        plats=[p],
        producteurs=[producteur(prenom="Léa")],
    )
    r = client_avec_repos(faux).get(MENU)
    assert r.status_code == 200

    corps = r.json()
    assert corps["restaurant"]["slug"] == "maison-salice"
    assert corps["categories"] == ["Entrées", "Plats", "Desserts", "Vins"]
    assert len(corps["plats"]) == 1
    # camelCase : url_photo (Python) → urlPhoto (JSON).
    assert corps["plats"][0]["urlPhoto"] == "/img/agneau.jpg"
    assert corps["producteurs"][0]["prenom"] == "Léa"


def test_menu_rattache_la_composition_au_bon_plat(client_avec_repos):
    """La composition (ingrédient) doit se retrouver dans le plat correspondant."""
    p = plat()
    prod = producteur()
    faux = FakeRepositories(
        restaurant=restaurant(),
        plats=[p],
        producteurs=[prod],
        compositions=[composition(p.id, producteur_id=prod.id, libelle={"fr": "Tomates"})],
    )
    r = client_avec_repos(faux).get(MENU)
    assert r.status_code == 200

    compo = r.json()["plats"][0]["composition"]
    assert len(compo) == 1
    assert compo[0]["libelle"] == {"fr": "Tomates"}
    # producteur_id (Python) → producteurId (camelCase), et c'est bien une chaîne.
    assert compo[0]["producteurId"] == str(prod.id)
