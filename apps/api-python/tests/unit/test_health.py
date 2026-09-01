"""
Test unitaire de l'endpoint transverse /health.

/health ne touche pas la base : c'est un test d'endpoint « pur » (rapide, CI).
"""


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True, "service": "tabla-api"}
