# ai-server

Smart FMS AI/ML 추론 서버 (FastAPI)

## 요구사항

- Python >= 3.13
- [uv](https://docs.astral.sh/uv/)

## 실행

```bash
uv sync
cp .env.example .env  # 필요시 값 수정
uv run uvicorn app.main:app --reload
```

- API 문서: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health
- 오염도 분석: `POST /predict` (자세한 계약은 `docs/API.md` 참고, 백엔드 Spring Boot만 호출)

## 테스트

```bash
uv run pytest
```

## 모델

`POST /predict`는 모델 2개를 동시에 돌려 raw 값만 반환한다. **등급(grade) 판정은 백엔드가 한다.**

| 모델 | 파일 | 감지 | 응답 필드 |
|---|---|---|---|
| Detection | `app/ml/trash_occupy_detection_best.pt` | `trash`, `occupy` | `trash_count`, `trash_large`, `occupy_detected` |
| Segmentation | `app/ml/stain_seg.pt` | `spill` (모델 내부 클래스명은 `stain`) | `roi_pollution_ratio` |

### 가중치 받기

가중치(`*.pt`)는 저장소에 커밋하지 않는다 (`.gitignore`). 팀 드라이브에서 받아 위 경로에 **파일명 그대로** 둔다.

- 다운로드: https://drive.google.com/drive/folders/1xdqQLjUiN50s3_5LvkOI9ZXjIViUHfPw
- 둘 중 하나라도 없으면 서버 시작(`load_model`) 단계에서 실패한다.
- 다른 위치에 두려면 `.env`의 `AI_SERVER_DETECTION_MODEL_PATH` / `AI_SERVER_SEGMENTATION_MODEL_PATH`로 경로를 덮어쓴다.
- 서버 시작 시 빈 이미지로 한 번씩 추론해 둔다(워밍업, 약 7초). 첫 반납 요청이 느려지지 않게 하기 위함.

### 기타

- 임계값(confidence, 대형 쓰레기 기준)은 `app/core/config.py`의 설정값이다. 하드코딩하지 않는다.
- 자세한 계약은 `docs/API.md` 1번 참고.

## 구조

```
app/
  api/
    routes/   # 엔드포인트
    router.py # 라우터 취합
  core/
    config.py # 환경설정 (pydantic-settings) — 모델 경로·임계값
  ml/
    model.py  # 2모델 로드 + 추론 → raw 값 집계
  main.py     # FastAPI 앱 진입점
tests/
```
