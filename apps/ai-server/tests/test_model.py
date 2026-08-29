"""build_prediction의 순수 집계 로직 테스트.

여기서는 YOLO 가중치를 로드하지 않는다. docs/API.md 1번의 raw 값 규칙만 검증한다.
"""

from app.ml.model import Detection, build_prediction

CONF = 0.6
LARGE = 0.01


def predict(detections=(), spill_ratio=0.0, spill_confidences=()):
    return build_prediction(
        detections,
        spill_ratio=spill_ratio,
        spill_confidences=spill_confidences,
        conf_threshold=CONF,
        large_area_ratio=LARGE,
    )


def test_counts_only_trash_boxes_in_trash_count() -> None:
    result = predict(
        detections=[
            Detection(label="trash", confidence=0.9, area_ratio=0.001),
            Detection(label="trash", confidence=0.8, area_ratio=0.002),
            Detection(label="occupy", confidence=0.9, area_ratio=0.05),
        ]
    )

    assert result["trash_count"] == 2


def test_occupy_box_sets_occupy_detected() -> None:
    result = predict(detections=[Detection(label="occupy", confidence=0.9, area_ratio=0.05)])

    assert result["occupy_detected"] is True
    assert result["trash_count"] == 0


def test_trash_large_is_true_when_a_trash_box_covers_at_least_one_percent() -> None:
    result = predict(detections=[Detection(label="trash", confidence=0.9, area_ratio=0.012)])

    assert result["trash_large"] is True


def test_trash_large_is_false_for_small_boxes_only() -> None:
    result = predict(detections=[Detection(label="trash", confidence=0.9, area_ratio=0.004)])

    assert result["trash_large"] is False


def test_detections_below_confidence_threshold_are_ignored() -> None:
    result = predict(detections=[Detection(label="trash", confidence=0.59, area_ratio=0.5)])

    assert result is None


def test_occupy_box_does_not_make_a_trash_large() -> None:
    result = predict(detections=[Detection(label="occupy", confidence=0.9, area_ratio=0.5)])

    assert result["trash_large"] is False


def test_roi_pollution_ratio_comes_from_spill_mask_only() -> None:
    result = predict(
        detections=[Detection(label="trash", confidence=0.9, area_ratio=0.30)],
        spill_ratio=0.08,
        spill_confidences=[0.9],
    )

    assert result["roi_pollution_ratio"] == 0.08


def test_confidence_averages_the_two_models() -> None:
    result = predict(
        detections=[Detection(label="trash", confidence=0.8, area_ratio=0.001)],
        spill_ratio=0.08,
        spill_confidences=[1.0],
    )

    assert result["confidence"] == 0.9


def test_confidence_uses_the_only_model_that_detected_something() -> None:
    result = predict(detections=[Detection(label="trash", confidence=0.8, area_ratio=0.001)])

    assert result["confidence"] == 0.8


def test_returns_none_when_nothing_detected() -> None:
    assert predict() is None


def test_ratios_are_rounded_to_two_decimals_and_clamped() -> None:
    result = predict(spill_ratio=1.234, spill_confidences=[0.912])

    assert result["roi_pollution_ratio"] == 1.0
    assert result["confidence"] == 0.91


def test_response_has_exactly_the_contract_fields() -> None:
    result = predict(
        detections=[Detection(label="trash", confidence=0.9, area_ratio=0.02)],
        spill_ratio=0.08,
        spill_confidences=[0.9],
    )

    assert set(result) == {
        "roi_pollution_ratio",
        "trash_count",
        "trash_large",
        "occupy_detected",
        "confidence",
    }
