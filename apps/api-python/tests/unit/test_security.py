"""
Tests unitaires de app/core/security.py (Argon2id + JWT).

On teste les PROPRIÉTÉS attendues d'une brique de sécurité, sans base :
  - un hash ne ressemble jamais au mot de passe en clair ;
  - le bon mot de passe se vérifie, un mauvais est rejeté ;
  - un JWT fabriqué se relit et contient bien les infos qu'on y a mises.
"""

import jwt
import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_ne_contient_pas_le_mot_de_passe_en_clair():
    empreinte = hash_password("s3cret-provence")
    assert empreinte != "s3cret-provence"
    assert "s3cret-provence" not in empreinte
    assert empreinte.startswith("$argon2id$")  # bien de l'Argon2id


def test_deux_hash_du_meme_mdp_sont_differents():
    """Argon2 sale (salt) chaque hash → deux empreintes distinctes du même mdp."""
    assert hash_password("meme") != hash_password("meme")


def test_verify_accepte_le_bon_mdp_et_refuse_le_mauvais():
    empreinte = hash_password("bonmdp")
    assert verify_password("bonmdp", empreinte) is True
    assert verify_password("mauvais", empreinte) is False


def test_jwt_aller_retour_conserve_les_infos():
    """create → decode : on retrouve sub / role / rid tels qu'on les a posés."""
    token = create_access_token(subject="user-42", role="admin", restaurant_id="resto-7")
    contenu = decode_access_token(token)
    assert contenu["sub"] == "user-42"
    assert contenu["role"] == "admin"
    assert contenu["rid"] == "resto-7"


def test_jwt_falsifie_est_rejete():
    """Un token trafiqué casse la signature → décodage refusé."""
    token = create_access_token(subject="u", role="restaurateur", restaurant_id=None)
    falsifie = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(falsifie)
