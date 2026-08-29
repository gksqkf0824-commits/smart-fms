from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/ai-server — 모델 경로를 cwd가 아니라 프로젝트 루트 기준으로 풀기 위해 사용한다.
_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_SERVER_", env_file=".env", extra="ignore")

    app_name: str = "smart-fms-ai-server"
    environment: str = "local"
    cors_origins: list[str] = ["http://localhost:3000"]

    # 모델 2개 (docs/API.md 1번)
    detection_model_path: str = "app/ml/trash_occupy_detection_best.pt"  # trash / occupy
    segmentation_model_path: str = "app/ml/stain_seg.pt"  # spill

    # 운영 정책값 — 하드코딩하지 않고 여기서 조정한다.
    detection_conf_threshold: float = 0.6  # Detection은 0.6 이상만 유효 객체로 취급
    segmentation_conf_threshold: float = 0.25
    trash_large_area_ratio: float = 0.01  # ROI의 1% 이상이면 대형 쓰레기

    def resolve(self, path: str) -> Path:
        """상대 경로면 ai-server 루트 기준으로 절대 경로를 만든다."""
        candidate = Path(path)
        return candidate if candidate.is_absolute() else _ROOT / candidate


@lru_cache
def get_settings() -> Settings:
    return Settings()
