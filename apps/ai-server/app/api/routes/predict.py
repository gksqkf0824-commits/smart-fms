import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.ml.model import run_inference

logger = logging.getLogger(__name__)

router = APIRouter(tags=["predict"])


class PredictResponse(BaseModel):
    """docs/API.md 1번의 raw 값. grade는 넣지 않는다 (백엔드가 판정)."""

    roi_pollution_ratio: float  # spill 오염 면적 비율 (0.0~1.0)
    trash_count: int  # 감지된 쓰레기 개수
    trash_large: bool  # ROI 1% 이상 대형 쓰레기 존재 여부
    occupy_detected: bool  # 소지품/유실물 감지 여부
    confidence: float  # 두 모델 confidence의 평균 (0.0~1.0)


@router.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        200: {"description": "분석 결과. 아무것도 탐지 못 하면 `no_target_detected`"},
        422: {"description": "image field required"},
        500: {"description": "inference_failed"},
    },
)
async def predict(image: UploadFile = File(...)):
    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(status_code=422, detail="image field required")

    try:
        result = run_inference(image_bytes)
    except Exception:
        # 원인은 서버 로그에만 남기고, 백엔드에는 계약상의 문자열만 내려준다.
        logger.exception("inference failed")
        raise HTTPException(status_code=500, detail="inference_failed")

    # 오염 요소를 하나도 못 찾은 경우. 백엔드는 이를 오염도 0(NORMAL)으로 처리한다.
    if result is None:
        return JSONResponse(status_code=200, content={"detail": "no_target_detected"})

    return PredictResponse(**result)
