from typing import Any

_model: Any | None = None


def load_model() -> None:
    """서버 시작 시 한 번만 호출된다 (app/main.py의 lifespan 참고).
    모델이 확정되면 여기서 torch.load(...) 등으로 가중치를 읽어 _model에 담는다.
    모델이 여러 개(예: trash용 + spill용)여도 각각 로드해서 여기 보관하면 된다.
    """
    global _model
    # TODO: 실제 모델 로드로 교체
    _model = "stub"


def run_inference(image_bytes: bytes) -> dict:
    """이미지 바이트를 받아 /predict 응답 형태의 dict를 반환한다.
    모델이 몇 개든 이 함수 안에서 결과를 합쳐 반환하면 되고,
    라우터(app/api/routes/predict.py)는 이 함수만 호출한다.
    """
    if _model is None:
        raise RuntimeError("model is not loaded — load_model()이 startup에서 호출되었는지 확인하세요")

    # TODO: 실제 추론으로 교체. 지금은 스캐폴딩용 더미 응답.
    return {
        "roi_pollution_ratio": 0.20,
        "classes": [
            {"type": "trash", "area_ratio": 0.12},
            {"type": "spill", "area_ratio": 0.08},
        ],
        "confidence": 0.91,
    }
