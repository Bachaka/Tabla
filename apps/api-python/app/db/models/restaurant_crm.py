"""
Modèle ORM des données CRM d'un restaurant. Table "restaurant_crm".

Table QU'ON POSSÈDE (créée par nous, au démarrage) — on ne touche pas la table
"restaurants" partagée avec l'API Node. Contient les champs de gestion
(forfait, santé, MRR, facturation) fabriqués/éditables via le back-office Admin.
"""

import uuid

from sqlmodel import Field, SQLModel


class RestaurantCrm(SQLModel, table=True):
    __tablename__ = "restaurant_crm"

    restaurant_id: uuid.UUID = Field(primary_key=True)
    forfait: str = "Essentiel"           # Essentiel | Pro | Enterprise
    score_sante: int = 75                # 0–100
    mrr: int = 0                         # € / mois
    statut_facturation: str = "trialing" # active | trialing | past_due | at_risk
    note: float | None = None
    notes: str | None = None
