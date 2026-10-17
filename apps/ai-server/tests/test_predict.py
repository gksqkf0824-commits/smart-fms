import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """가중치 로드 없이 라우터 계약만 검증한다 (lifespan의 load_model을 막는다)."""
    with patch("app.main.load_model"), TestClient(app) as test_client:
        yield test_client


def upload(**kwargs):
    return {"image": ("car.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")}


def test_predict_returns_raw_values_from_both_models(client) -> None:
    inference_result = {
        "roi_pollution_ratio": 0.08,
        "trash_count": 3,
        "trash_large": False,
        "occupy_detected": True,
        "confidence": 0.91,
    }

    with patch("app.api.routes.predict.run_inference", return_value=inference_result):
        response = client.post("/predict", files=upload())

    assert response.status_code == 200
    assert response.json() == inference_result


def test_predict_does_not_return_a_grade(client) -> None:
    """등급 판정은 백엔드 몫이다 (docs/API.md 1번)."""
    inference_result = {
        "roi_pollution_ratio": 0.08,
        "trash_count": 3,
        "trash_large": False,
        "occupy_detected": True,
        "confidence": 0.91,
    }

    with patch("app.api.routes.predict.run_inference", return_value=inference_result):
        response = client.post("/predict", files=upload())

    assert "grade" not in response.json()
    assert "classes" not in response.json()


def test_predict_returns_no_target_detected_when_nothing_found(client) -> None:
    with patch("app.api.routes.predict.run_inference", return_value=None):
        response = client.post("/predict", files=upload())

    assert response.status_code == 200
    assert response.json() == {"detail": "no_target_detected"}


def test_predict_rejects_empty_upload(client) -> None:
    files = {"image": ("car.jpg", io.BytesIO(b""), "image/jpeg")}

    response = client.post("/predict", files=files)

    assert response.status_code == 422
    assert response.json()["detail"] == "image field required"


def test_predict_returns_inference_failed_when_the_model_raises(client) -> None:
    with patch("app.api.routes.predict.run_inference", side_effect=RuntimeError("boom")):
        response = client.post("/predict", files=upload())

    assert response.status_code == 500
    assert response.json()["detail"] == "inference_failed"
