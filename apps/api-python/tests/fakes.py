"""
tests/fakes.py — faux Repositories en mémoire (test double « fake »).

RAPPEL de l'architecture : nos endpoints ne parlent plus jamais SQL. Ils
demandent tout à un objet `Repositories` injecté par `Depends(get_repositories)`.
Chaque repo (repos.plats, repos.puces…) sait « comment » aller chercher en base.

Conséquence pour les tests : si on remplace ce `Repositories` par un objet qui
répond les MÊMES méthodes mais depuis des listes Python, l'endpoint s'exécute
EXACTEMENT pareil… sans base de données. C'est un « fake » (test double) :
une vraie implémentation, simplement en mémoire.

On branche ce fake via `app.dependency_overrides[get_repositories]` (voir
conftest.py) : FastAPI appelle notre fabrique au lieu de la vraie.

⚠️ On n'implémente ici QUE les méthodes utilisées par les endpoints testés
(menu, tap). C'est volontaire : un fake couvre le besoin du test, pas toute
l'interface. On l'étoffe au fur et à mesure qu'on teste de nouveaux endpoints.
"""

import uuid


class _FakeSession:
    """Fausse session SQLAlchemy : juste de quoi absorber set_tenant/clear_tenant.

    `set_tenant(session, rid)` fait `session.execute(text("SELECT set_config…"))`.
    En test, on ne veut aucune base : on rend donc `execute`/`commit` inoffensifs.
    """

    def execute(self, *args, **kwargs):
        return None

    def commit(self):
        pass


class _FakeRestaurantRepo:
    """repos.restaurants — retrouve LE restaurant par slug ou par id."""

    def __init__(self, resto):
        self._resto = resto

    def get_par_slug(self, slug: str):
        if self._resto is not None and self._resto.slug == slug:
            return self._resto
        return None

    def get(self, restaurant_id: uuid.UUID):
        if self._resto is not None and self._resto.id == restaurant_id:
            return self._resto
        return None


class _FakeListeRepo:
    """repos.plats / .producteurs / .compositions — renvoie la liste fournie.

    Le test contrôle exactement le contenu, donc `lister_par_restaurant` renvoie
    simplement tout ce qu'on lui a donné (pas besoin de filtrer par restaurant).
    """

    def __init__(self, items):
        self._items = list(items)

    def lister_par_restaurant(self, restaurant_id: uuid.UUID):
        return list(self._items)


class _FakePuceRepo:
    """repos.puces — retrouve LA puce par uid ou par id."""

    def __init__(self, puce):
        self._puce = puce

    def get_par_uid(self, uid: str):
        if self._puce is not None and self._puce.uid == uid:
            return self._puce
        return None

    def get(self, puce_id: uuid.UUID):
        if self._puce is not None and self._puce.id == puce_id:
            return self._puce
        return None


class _FakeTableRepo:
    """repos.tables — retrouve LA table par id."""

    def __init__(self, table):
        self._table = table

    def get(self, table_id: uuid.UUID):
        if self._table is not None and self._table.id == table_id:
            return self._table
        return None


class _FakeEvenementRepo:
    """repos.evenements — mémorise les événements « ajoutés » pour vérification.

    Le test pourra ensuite inspecter `.ajoutes` pour prouver qu'un tap a bien
    été enregistré (c'est tout l'intérêt : vérifier l'effet de bord SANS base).
    """

    def __init__(self):
        self.ajoutes = []

    def ajouter(self, evenement) -> None:
        self.ajoutes.append(evenement)


class FakeRepositories:
    """Faux `Repositories` : même « forme » que le vrai, mais en mémoire.

    On fournit au constructeur les données que le test veut voir retournées ;
    chaque attribut expose les mêmes méthodes que le vrai repo correspondant.
    `commit()` compte les validations (Unit of Work) pour d'éventuelles assertions.
    """

    def __init__(
        self,
        *,
        restaurant=None,
        plats=(),
        producteurs=(),
        compositions=(),
        puce=None,
        table=None,
    ):
        self.session = _FakeSession()
        self.restaurants = _FakeRestaurantRepo(restaurant)
        self.plats = _FakeListeRepo(plats)
        self.producteurs = _FakeListeRepo(producteurs)
        self.compositions = _FakeListeRepo(compositions)
        self.puces = _FakePuceRepo(puce)
        self.tables = _FakeTableRepo(table)
        self.evenements = _FakeEvenementRepo()
        self.commits = 0  # combien de fois le Unit of Work a validé

    def commit(self) -> None:
        self.commits += 1
