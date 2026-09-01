"""
Ajoute au parc des puces NFC PHYSIQUES déjà en main (UID réels lus au lecteur).

Contrairement au seed (qui recrée un jeu de démo et suppose des tables vides),
ce script INSÈRE quelques lignes précises dans la base VIVANTE. Il est donc
écrit pour être sans danger :

  • idempotent — on saute tout UID déjà présent (relançable sans doublon) ;
  • ciblé — il n'insère que les UID listés ci-dessous, rien d'autre ;
  • non destructif — aucune ligne existante n'est modifiée ni supprimée.

Les puces sont ajoutées en STOCK : pas de restaurant, pas de table, statut
« approvisionnee ». On les rattachera plus tard (Admin : lot / appairage).

    uv run python -m app.scripts.ajouter_puces
"""

import uuid

from sqlmodel import Session, select

from app.core.db import admin_engine as engine
from app.db.models import PuceNfc

# UID PHYSIQUES lus au lecteur NFC (NTAG215). Même format que la table `puces` :
# 7 octets hex, préfixe fabricant 04, MAJUSCULES, séparés par ':'. Le tap est
# résolu par correspondance EXACTE de cette chaîne — donc on n'y touche pas.
UIDS = [
    "04:DA:FE:16:3E:61:80",
    "04:64:20:19:3E:61:80",
    "04:7B:2C:18:3E:61:80",
    "04:0E:04:17:3E:61:80",
]


def main() -> None:
    with Session(engine) as s:
        for uid in UIDS:
            # Idempotence : si l'UID existe déjà, on ne réinsère pas.
            deja = s.exec(select(PuceNfc).where(PuceNfc.uid == uid)).first()
            if deja is not None:
                print(f"  {uid} — déjà présente ({deja.statut}), ignorée")
                continue

            s.add(
                PuceNfc(
                    id=uuid.uuid4(),
                    uid=uid,
                    restaurant_id=None,   # stock : pas encore rattachée
                    table_id=None,        # pas encore appairée
                    statut="approvisionnee",
                    cible={"kind": "menu"},
                )
            )
            print(f"  {uid} — insérée (approvisionnee, stock)")
        s.commit()
    print("[ajouter_puces] OK")


if __name__ == "__main__":
    main()
