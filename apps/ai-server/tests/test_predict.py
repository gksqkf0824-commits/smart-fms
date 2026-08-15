import io

from fastapi.testclient import TestClient

from app.main import app

def test_predict_returns_pollution_result() -> None:
    files = {"image": ("car.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")}
    with TestClient(app) as client:
        response = client.post("/predict", files=files)

    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["roi_pollution_ratio"] <= 1.0
    assert {c["type"] for c in body["classes"]} <= {"trash", "spill"}
    assert 0.0 <= body["confidence"] <= 1.0
