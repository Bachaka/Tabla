"""
Tests unitaires des utilitaires d'UID NFC (app/modules/admin/features/parc/router.py).

  _uid_court : garde les 6 derniers hex, en MAJUSCULE (identifiant lisible) ;
  _gen_uid   : fabrique un UID NFC réaliste (préfixe NXP 04 + 6 octets).
"""

import re

from app.modules.admin.features.parc.router import _gen_uid, _uid_court


def test_uid_court_prend_les_six_derniers_sans_deux_points():
    assert _uid_court("04:A1:B2:C3:D4:E5:F6") == "D4E5F6"


def test_uid_court_met_en_majuscules():
    assert _uid_court("04:ab:cd:ef:12:34:56") == "123456"


def test_gen_uid_a_le_bon_format():
    """7 octets hex séparés par ':' , commençant par le préfixe fabricant 04."""
    uid = _gen_uid()
    assert re.fullmatch(r"04(:[0-9A-F]{2}){6}", uid)


def test_gen_uid_est_aleatoire():
    """Deux générations successives diffèrent (collision quasi impossible)."""
    assert _gen_uid() != _gen_uid()
