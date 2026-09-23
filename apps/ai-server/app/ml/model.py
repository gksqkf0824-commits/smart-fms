"""2모델(Detection + Segmentation) 추론 — docs/API.md 1번 계약 구현.

- Detection (`trash_occupy_detection_best.pt`): trash/occupy를 박스로 잡아 **개수·크기**를 낸다.
- Segmentation (`stain_seg.pt`): spill을 마스크로 잡아 **면적 비율**을 낸다.

등급(grade) 판정은 하지 않는다. raw 값만 반환하고 판정은 백엔드가 한다.

ultralytics/torch/PIL은 모듈 최상단에서 import하지 않는다. 라우터 테스트가
가중치나 무거운 의존성 없이 이 모듈을 import할 수 있어야 하기 때문이다.
"""

import os
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings

TRASH_LABEL = "trash"
OCCUPY_LABEL = "occupy"

_detection_model: Any | None = None
_segmentation_model: Any | None = None


@dataclass(frozen=True)
class Detection:
    """Detection 모델이 잡은 박스 1개."""

    label: str
    confidence: float
    area_ratio: float  # 박스 면적 / 이미지 전체 면적


def load_model() -> None:
    """서버 시작 시 한 번만 호출된다 (app/main.py의 lifespan 참고)."""
    global _detection_model, _segmentation_model

    # ultralytics는 의존성이 빠지면 요청 처리 도중에 pip install을 시도한다.
    # 서버에서는 런타임 설치가 위험하므로 끈다 (import 전에 설정해야 적용된다).
    os.environ.setdefault("YOLO_AUTOINSTALL", "false")

    from ultralytics import YOLO

    settings = get_settings()
    _detection_model = YOLO(str(settings.resolve(settings.detection_model_path)))
    _segmentation_model = YOLO(str(settings.resolve(settings.segmentation_model_path)))


def run_inference(image_bytes: bytes) -> dict | None:
    """이미지 바이트를 받아 /predict 응답 dict를 반환한다.

    아무것도 탐지하지 못하면 None을 반환하고, 라우터가 이를
    `no_target_detected`로 변환한다.
    """
    if _detection_model is None or _segmentation_model is None:
        raise RuntimeError(
            "model is not loaded — load_model()이 startup에서 호출되었는지 확인하세요"
        )

    import io

    from PIL import Image

    settings = get_settings()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    detection_result = _detection_model.predict(
        image, conf=settings.detection_conf_threshold, verbose=False
    )[0]
    segmentation_result = _segmentation_model.predict(
        image, conf=settings.segmentation_conf_threshold, verbose=False
    )[0]

    spill_ratio, spill_confidences = _read_spill(
        segmentation_result, settings.segmentation_conf_threshold
    )

    return build_prediction(
        _read_detections(detection_result),
        spill_ratio=spill_ratio,
        spill_confidences=spill_confidences,
        conf_threshold=settings.detection_conf_threshold,
        large_area_ratio=settings.trash_large_area_ratio,
    )


def build_prediction(
    detections: Sequence[Detection],
    *,
    spill_ratio: float,
    spill_confidences: Sequence[float],
    conf_threshold: float,
    large_area_ratio: float,
) -> dict | None:
    """두 모델의 결과를 docs/API.md의 raw 값 5개로 합친다."""
    kept = [d for d in detections if d.confidence >= conf_threshold]
    trash = [d for d in kept if d.label == TRASH_LABEL]

    pollution_ratio = _clamp(spill_ratio)
    if not kept and pollution_ratio <= 0:
        return None

    per_model_confidence = []
    if kept:
        per_model_confidence.append(_mean(d.confidence for d in kept))
    if pollution_ratio > 0 and spill_confidences:
        per_model_confidence.append(_mean(spill_confidences))

    return {
        "roi_pollution_ratio": round(pollution_ratio, 2),
        "trash_count": len(trash),
        "trash_large": any(d.area_ratio >= large_area_ratio for d in trash),
        "occupy_detected": any(d.label == OCCUPY_LABEL for d in kept),
        "confidence": round(_mean(per_model_confidence), 2) if per_model_confidence else 0.0,
    }


def _read_detections(result: Any) -> list[Detection]:
    """ultralytics Detection 결과 → Detection 목록."""
    boxes = getattr(result, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return []

    height, width = result.orig_shape
    image_area = float(height * width)
    if image_area <= 0:
        return []

    names = result.names
    detections = []
    for box in boxes:
        x1, y1, x2, y2 = (float(v) for v in box.xyxy[0])
        box_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        detections.append(
            Detection(
                label=names[int(box.cls)],
                confidence=float(box.conf),
                area_ratio=box_area / image_area,
            )
        )
    return detections


def _read_spill(result: Any, conf_threshold: float) -> tuple[float, list[float]]:
    """ultralytics Segmentation 결과 → (오염 면적 비율, confidence 목록).

    마스크가 겹칠 수 있으므로 합집합으로 면적을 센다 (중복 가산 방지).
    """
    masks = getattr(result, "masks", None)
    boxes = getattr(result, "boxes", None)
    if masks is None or masks.data is None or len(masks.data) == 0 or boxes is None:
        return 0.0, []

    # segment 태스크에서 마스크와 박스는 1:1이다. confidence를 못 붙이는 마스크는
    # 면적에서도 빼야 한다 — 안 그러면 "오염 8% / confidence 0.0" 같은 응답이 나간다.
    confidences = [float(c) for c in boxes.conf]
    keep = [i for i, c in enumerate(confidences) if c >= conf_threshold and i < len(masks.data)]
    if not keep:
        return 0.0, []

    union = (masks.data[keep] > 0.5).any(dim=0)
    total_pixels = union.numel()
    if total_pixels == 0:
        return 0.0, []

    ratio = float(union.sum().item()) / total_pixels
    return ratio, [confidences[i] for i in keep]


def _clamp(value: float) -> float:
    return min(max(float(value), 0.0), 1.0)


def _mean(values) -> float:
    values = list(values)
    return sum(values) / len(values) if values else 0.0
