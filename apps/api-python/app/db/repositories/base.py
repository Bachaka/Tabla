"""
Base commune des repositories.

Un Repository encapsule les requêtes d'UNE entité. Tous partagent la même
Session (celle de la requête HTTP en cours) : elle est injectée à la
construction. C'est le seul état d'un Repository.
"""

from sqlmodel import Session


class Repository:
    def __init__(self, session: Session) -> None:
        self.session = session
