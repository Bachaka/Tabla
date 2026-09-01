"""schemas.py — DTO de sortie des statistiques d'engagement."""

from app.shared.schema import CamelModel


# ── Stats d'un restaurant (dashboard Restaurateur) ─────────────────────
class TableStat(CamelModel):
    libelle: str
    taps: int


class PlatStat(CamelModel):
    nom: dict   # { "fr": "..." }
    vues: int


class StatsRestaurant(CamelModel):
    total_taps: int
    total_vues_plats: int
    taps_par_table: list[TableStat]
    plats_les_plus_vus: list[PlatStat]


# ── Vue d'ensemble plateforme (cockpit Admin) ──────────────────────────
class RestaurantRollup(CamelModel):
    nom: str
    slug: str
    ville: str
    taps: int


class OverviewAdmin(CamelModel):
    nb_restaurants: int
    nb_tables: int
    nb_puces: int
    total_taps: int
    total_evenements: int
    restaurants: list[RestaurantRollup]
