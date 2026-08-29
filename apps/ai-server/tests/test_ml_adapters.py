"""ultralytics Result → 내부 표현 어댑터 테스트.

torch 텐서를 실제로 다루므로 torch가 없으면 건너뛴다.
(라우터·집계 로직 테스트는 torch 없이도 돌아간다 — test_predict.py / test_model.py)
"""

import pytest

torch = pytest.importorskip("torch")

from app.ml.model import _read_detections, _read_spill


class FakeMasks:
    def __init__(self, data):
        self.data = data


class FakeBoxes:
    def __init__(self, conf):
        self.conf = torch.tensor(conf)

    def __len__(self):
        return len(self.conf)


class FakeBox:
    def __init__(self, cls, conf, xyxy):
        self.cls = torch.tensor([cls])
        self.conf = torch.tensor([conf])
        self.xyxy = torch.tensor([xyxy])


class FakeDetectionBoxes(list):
    pass


class FakeResult:
    def __init__(self, masks=None, boxes=None, names=None, orig_shape=(100, 100)):
        self.masks = masks
        self.boxes = boxes
        self.names = names or {0: "trash", 1: "occupy"}
        self.orig_shape = orig_shape


def mask(rows):
    return torch.tensor(rows, dtype=torch.float32)


def test_spill_ratio_is_covered_pixels_over_total() -> None:
    result = FakeResult(
        masks=FakeMasks(torch.stack([mask([[1, 1], [0, 0]])])), boxes=FakeBoxes([0.9])
    )

    ratio, confidences = _read_spill(result, 0.25)

    assert ratio == 0.5
    assert confidences == [pytest.approx(0.9)]


def test_overlapping_masks_are_unioned_not_double_counted() -> None:
    same = mask([[1, 1], [0, 0]])
    result = FakeResult(masks=FakeMasks(torch.stack([same, same])), boxes=FakeBoxes([0.9, 0.8]))

    ratio, _ = _read_spill(result, 0.25)

    assert ratio == 0.5


def test_masks_below_confidence_threshold_are_dropped() -> None:
    result = FakeResult(
        masks=FakeMasks(torch.stack([mask([[1, 1], [1, 1]]), mask([[1, 1], [0, 0]])])),
        boxes=FakeBoxes([0.10, 0.90]),
    )

    ratio, confidences = _read_spill(result, 0.25)

    assert ratio == 0.5
    assert confidences == [pytest.approx(0.9)]


def test_a_nonzero_spill_ratio_always_carries_confidences() -> None:
    """ratio > 0인데 confidence가 비면 백엔드가 '오염 8%, 확신 0.0'을 받게 된다."""
    result = FakeResult(masks=FakeMasks(torch.stack([mask([[1, 1], [0, 0]])])), boxes=None)

    ratio, confidences = _read_spill(result, 0.25)

    assert not (ratio > 0 and not confidences)


def test_no_masks_means_no_spill() -> None:
    ratio, confidences = _read_spill(FakeResult(masks=None, boxes=FakeBoxes([])), 0.25)

    assert (ratio, confidences) == (0.0, [])


def test_detection_area_ratio_is_box_area_over_image_area() -> None:
    result = FakeResult(
        boxes=FakeDetectionBoxes([FakeBox(cls=0, conf=0.9, xyxy=[0, 0, 10, 10])]),
        orig_shape=(100, 100),
    )

    detections = _read_detections(result)

    assert len(detections) == 1
    assert detections[0].label == "trash"
    assert detections[0].area_ratio == pytest.approx(0.01)
    assert detections[0].confidence == pytest.approx(0.9)


def test_detection_resolves_class_names_from_the_model() -> None:
    result = FakeResult(
        boxes=FakeDetectionBoxes([FakeBox(cls=1, conf=0.7, xyxy=[0, 0, 50, 50])]),
        orig_shape=(100, 100),
    )

    assert _read_detections(result)[0].label == "occupy"


def test_no_boxes_means_no_detections() -> None:
    assert _read_detections(FakeResult(boxes=FakeDetectionBoxes())) == []
