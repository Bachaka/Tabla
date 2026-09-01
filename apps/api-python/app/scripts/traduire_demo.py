"""
Ajoute les traductions ANGLAISES du contenu de démo (Maison Salice).

    uv run python -m app.scripts.traduire_demo

Nos champs de contenu sont des colonnes jsonb localisées, ex. nom = {"fr": …}.
Ce script AJOUTE la clé "en" sans toucher au français, via jsonb_set + to_jsonb.
Il est IDEMPOTENT (relançable) et NON destructif : il n'ajoute qu'une clé.

Contexte i18n : le front (Convive) choisit la langue et retombe sur le français
si une traduction manque. Ce script fournit l'anglais pour que la bascule FR/EN
change aussi le CONTENU (et pas seulement l'interface).

⚠️ Utilise le compte ADMIN (propriétaire, hors RLS) — comme seed.py.
"""

from sqlalchemy import text
from sqlmodel import Session

from app.core.db import admin_engine as engine

# ── Plats : code → traductions anglaises (nom / resume / description) ──────
PLATS = {
    "tomates": {
        "nom": "Heirloom tomatoes & burrata",
        "resume": "Four varieties from Léa's garden, Puglian burrata, greenhouse basil.",
        "description": (
            "A dish that doesn't lie. Four tomatoes picked that same morning at Léa's — "
            "Black Krim, Pineapple, Cornue des Andes, Green Zebra — laid over a milky, "
            "still-warm burrata. Olive oil from our neighbour, Camargue fleur de sel, "
            "fresh basil torn by hand."
        ),
    },
    "courgette": {
        "nom": "Stuffed courgette flowers",
        "resume": "Jean's fresh brousse, Menton lemon, rosemary honey.",
        "description": (
            "Flowers picked at dawn before they close. A light filling of Jean's goat "
            "brousse, Menton lemon zest, a veil of rosemary honey. Fried for a minute, "
            "served without waiting."
        ),
    },
    "carpaccio": {
        "nom": "Beetroot carpaccio",
        "resume": "Three salt-roasted beetroots, toasted hazelnuts, camelina oil.",
        "description": (
            "Chioggia, golden and Detroit red beetroots, roasted three hours in a salt "
            "crust. Thinly sliced, toasted Piedmont hazelnuts, cold-pressed camelina oil. "
            "A dressing of aged raspberry vinegar."
        ),
    },
    "agneau": {
        "nom": "Seven-hour lamb shoulder",
        "resume": "Confit Alpilles lamb, short thyme jus, crushed potatoes.",
        "description": (
            "A whole shoulder of Alpilles milk-fed lamb, confit for seven hours in its own "
            "juices. Fresh thyme, Lautrec pink garlic, a dash of Marius's wine. Served with "
            "crushed Charlotte potatoes and green olive oil."
        ),
    },
    "loup": {
        "nom": "Line-caught sea bass, braised fennel",
        "resume": "Longline-caught the day before, Léa's fennel braised in pastis.",
        "description": (
            "Whole Mediterranean sea bass, longline-caught by Olivier off Carry-le-Rouet. "
            "Cooked on the skin, fennel braised in pastis, a potato mousseline with new "
            "olive oil."
        ),
    },
    "risotto": {
        "nom": "Wild-herb risotto",
        "resume": "Carnaroli, pea-pod broth, herbs from the kitchen garden.",
        "description": (
            "Carnaroli rice mantecato with a broth of pea pods — nothing is wasted. "
            "Chervil, tarragon, lovage, sorrel and edible flowers picked in the morning. "
            "A shaving of Jean's tomme grated at the table."
        ),
    },
    "ratatouille": {
        "nom": "Slow-cooked ratatouille, perfect egg",
        "resume": "Léa's vegetables cooked separately, egg at 63°.",
        "description": (
            "Each vegetable cooked apart — aubergine, courgette, pepper, tomato — then "
            "assembled warm. A low-temperature organic egg on top, a dash of new olive oil, "
            "basil."
        ),
    },
    "tarte": {
        "nom": "Thin apricot tart",
        "resume": "Bergeron apricots, Fatima's pastry, rosemary ice cream.",
        "description": (
            "An inverted puff pastry kneaded by Fatima, Bergeron apricots roasted with "
            "vergeoise sugar, ice cream infused overnight with fresh rosemary. Out of the "
            "oven to order."
        ),
    },
    "fromages": {
        "nom": "Jean's three goat cheeses",
        "resume": "Fresh, semi-dry, three-month aged. Fatima's bread.",
        "description": (
            "A tasting of three ages of the same goat cheese: fresh of the day, semi-dry "
            "at ten days, and ash-aged at three months. Served with Fatima's spelt bread "
            "and a Sault lavender honey."
        ),
    },
    "vin-rouge": {
        "nom": "Domaine des Trois Pierres, 2022",
        "resume": "Grenache, Cinsault. Amphora-aged. Served at 16°.",
        "description": (
            "Marius's signature blend. Old-vine Grenache, red-clay Cinsault, aged six "
            "months in stoneware amphora. Notes of black cherry, garrigue, white pepper. "
            "Served cool."
        ),
    },
    "vin-rose": {
        "nom": "Saignée rosé, 2024",
        "resume": "Cold-pressed Grenache. Vineyard peach, redcurrant. Served at 10°.",
        "description": (
            "Marius's rosé, drawn off the red vats by saignée. Petal colour, a nose of "
            "vineyard peach and redcurrant, a saline finish that calls for an aperitif. "
            "Night harvest to keep the freshness."
        ),
    },
    "vin-blanc": {
        "nom": "Roussanne white, 2023",
        "resume": "Roussanne, Clairette. Aged on lees. Served at 11°.",
        "description": (
            "A white for both thirst and the table. Roussanne and Clairette aged on fine "
            "lees, notes of fresh almond, hawthorn blossom and lemon zest. The cuvée Marius "
            "keeps for fish."
        ),
    },
}

# ── Producteurs : code → traductions anglaises (role / histoire) ──────────
PRODUCTEURS = {
    "lea": {
        "role": "Market gardener",
        "histoire": (
            "Léa took over her grandmother's farm seven years ago. Three hectares in "
            "biodynamics, farmer's seeds, and a wooden greenhouse she built by hand. She "
            "delivers every Tuesday and Friday, at dawn, in an old Berlingo that smells of "
            "basil."
        ),
    },
    "jean": {
        "role": "Cheese ager",
        "histoire": (
            "Jean has aged goat cheeses for thirty-two years in a cellar dug into the flank "
            "of Mont Ventoux. He refuses to pasteurise, refuses to standardise, and keeps a "
            "herd of fifty animals — not one more."
        ),
    },
    "marius": {
        "role": "Winemaker",
        "histoire": (
            "Marius is the third generation on five hectares of Grenache and Cinsault. Hand "
            "harvest, amphora ageing, labels drawn by his daughter. The wine is served at "
            "cellar temperature."
        ),
    },
    "fatima": {
        "role": "Baker",
        "histoire": (
            "Fatima bakes over a wood fire three times a week. Farmer's einkorn flours, a "
            "long thirty-hour fermentation. Her bread arrives still warm at seven in the "
            "evening, wrapped in cloth."
        ),
    },
}

# jsonb_set(colonne, '{en}', to_jsonb(:valeur::text)) → ajoute la clé "en".
_SQL_PLAT = text(
    "UPDATE plats SET "
    "nom = jsonb_set(nom, '{en}', to_jsonb(CAST(:nom AS text))), "
    "resume = jsonb_set(resume, '{en}', to_jsonb(CAST(:resume AS text))), "
    "description = jsonb_set(description, '{en}', to_jsonb(CAST(:description AS text))) "
    "WHERE code = :code"
)
_SQL_PRODUCTEUR = text(
    "UPDATE producteurs SET "
    "role = jsonb_set(role, '{en}', to_jsonb(CAST(:role AS text))), "
    "histoire = jsonb_set(histoire, '{en}', to_jsonb(CAST(:histoire AS text))) "
    "WHERE code = :code"
)


def main() -> None:
    with Session(engine) as s:
        for code, tr in PLATS.items():
            res = s.execute(_SQL_PLAT, {"code": code, **tr})
            print(f"  plat        {code:<14} {'+ traduit' if res.rowcount else '— introuvable'}")
        for code, tr in PRODUCTEURS.items():
            res = s.execute(_SQL_PRODUCTEUR, {"code": code, **tr})
            print(f"  producteur  {code:<14} {'+ traduit' if res.rowcount else '— introuvable'}")
        s.commit()
    print("[traduire_demo] OK")


if __name__ == "__main__":
    main()
