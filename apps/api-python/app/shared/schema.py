"""
app/shared/schema.py — helper transverse partagé par les features.

CamelModel : base des DTO de sortie. Convertit les champs snake_case (noms de
la base) en camelCase (attendu par le front), et se construit directement
depuis un objet ORM. Placé dans shared/ car plusieurs features s'en servent
(menu, tap…) — on ne le duplique pas.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,   # url_photo → urlPhoto
        populate_by_name=True,
        from_attributes=True,       # construction depuis un objet ORM
    )
