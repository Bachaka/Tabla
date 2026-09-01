"""
conftest.py — fixtures partagées par TOUS les tests (pytest les découvre seul).

Deux familles de tests cohabitent dans ce projet :

• tests/unit/        → rapides, SANS base. On remplace les Repositories par des
                       faux (tests/fakes.py). C'est ce que lance la CI.
• tests/integration/ → l'app réelle frappe la base Azure de dev. Marqués
                       @pytest.mark.integration, EXCLUS par défaut
                       (voir pyproject.toml : addopts = -m "not integration").
                       On les lance à la demande : `uv run pytest -m integration`.

Ce fichier fournit :
  - `client`             : un client HTTP de test (TestClient) sur l'app réelle ;
  - `overrides_nettoyes` : autouse, remet à zéro les injections après CHAQUE test
                           (sinon un faux repo « fuiterait » sur le test suivant) ;
  - `client_avec_repos`  : fabrique un client dont les Repositories sont un fake.
"""

import pytest
from fastapi.testclient import TestClient

from app.db.repositories import get_repositories
from app.main import app


@pytest.fixture
def client() -> TestClient:
    """Client HTTP de test appelant l'app en mémoire (sans réseau).

    ⚠️ On n'utilise PAS `with TestClient(app)` : sans le `with`, le cycle de vie
    (lifespan) de l'app ne démarre pas, donc aucune connexion Azure à l'import.
    Les tests unitaires restent ainsi 100 % hors-base ; les tests d'intégration,
    eux, connectent la base au premier appel d'endpoint.
    """
    return TestClient(app)


@pytest.fixture(autouse=True)
def overrides_nettoyes():
    """Après chaque test, on efface les injections remplacées (dependency_overrides).

    autouse=True → s'applique automatiquement à tous les tests, sans qu'ils aient
    à la demander. Garantit l'isolation : un faux repo posé par un test unitaire
    ne contamine jamais le test suivant.
    """
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client_avec_repos(client):
    """Renvoie une fonction : on lui donne un FakeRepositories, elle branche l'app.

    Usage dans un test :
        def test_x(client_avec_repos):
            faux = FakeRepositories(restaurant=restaurant())
            c = client_avec_repos(faux)
            r = c.get("/api/v1/restaurants/maison-salice/menu")

    Sous le capot : on dit à FastAPI « quand un endpoint demande get_repositories,
    donne-lui NOTRE faux au lieu du vrai ». Le nettoyage est fait par la fixture
    autouse ci-dessus.
    """

    def _brancher(faux_repos) -> TestClient:
        app.dependency_overrides[get_repositories] = lambda: faux_repos
        return client

    return _brancher
