"""
Tests unitaires de l'endpoint GET /t/{uid} (résolution d'un tap NFC).

Points vérifiés SANS base :
  - puce inconnue / désactivée → 404 ;
  - tap valide → 200, contexte résolu (restaurant, service…) ;
  - EFFET DE BORD : un événement 'tap' anonyme est bien enregistré + commit
    (le fake mémorise les ajouts et compte les validations Unit of Work).
"""

from tests.factories import puce, restaurant, table
from tests.fakes import FakeRepositories

# Le router tap est monté à la racine (voir main.py) : GET /t/{uid}.
TAP = "/t/04:A1:B2:C3:D4:E5:F6"


def test_tap_404_si_puce_inconnue(client_avec_repos):
    c = client_avec_repos(FakeRepositories(puce=None, restaurant=restaurant()))
    r = c.get("/t/04:00:00:00:00:00:00")
    assert r.status_code == 404
    assert r.json()["detail"] == "unknown_tag"


def test_tap_404_si_puce_desactivee(client_avec_repos):
    pc = puce(statut="desactivee")
    c = client_avec_repos(FakeRepositories(puce=pc, restaurant=restaurant()))
    r = c.get(f"/t/{pc.uid}")
    assert r.status_code == 404
    assert r.json()["detail"] == "unknown_tag"


def test_tap_ok_resout_le_contexte(client_avec_repos):
    faux = FakeRepositories(puce=puce(), restaurant=restaurant())
    r = client_avec_repos(faux).get(TAP)
    assert r.status_code == 200

    corps = r.json()
    assert corps["restaurant"]["slug"] == "maison-salice"
    assert corps["service"] in ("midi", "soir")
    assert corps["cible"] == {"kind": "menu"}
    assert corps["lang"] == "fr"


def test_tap_enregistre_un_evenement_anonyme(client_avec_repos):
    """Effet de bord : 1 événement 'tap' ajouté + 1 commit (Unit of Work)."""
    t = table(libelle="07")
    faux = FakeRepositories(puce=puce(table_id=t.id), restaurant=restaurant(), table=t)
    r = client_avec_repos(faux).get(TAP)
    assert r.status_code == 200

    assert len(faux.evenements.ajoutes) == 1
    ev = faux.evenements.ajoutes[0]
    assert ev.type == "tap"
    assert ev.table_id == t.id      # attribué à la TABLE, jamais à une personne
    assert ev.sujet_id is None      # anonyme (RGPD by design)
    assert faux.commits == 1        # la transaction a bien été validée
