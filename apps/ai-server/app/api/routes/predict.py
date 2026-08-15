from typing import Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.ml.model import run_inference

router = APIRouter(tags=["predict"])

PollutionType = Literal["trash", "spill"]


class PollutionClass(BaseModel):
    type: PollutionType
    area_ratio: float


class PredictResponse(BaseModel):
    roi_pollution_ratio: float
    classes: list[PollutionClass]
    confidence: float


@router.post("/predict", response_model=PredictResponse)
async def predict(image: UploadFile = File(...)) -> PredictResponse:
    image_bytes = await image.read()

    # 오염/분석 대상을 못 찾은 경우 422 + "no_target_detected"를 반환하고,
    # 백엔드는 이를 오염도 0(정상)으로 처리한다 (docs/API.md 참고).
    if not image_bytes:
        raise HTTPException(status_code=422, detail="no_target_detected")

    result = run_inference(image_bytes)
    return PredictResponse(**result)
