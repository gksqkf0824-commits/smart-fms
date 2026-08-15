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

## 구조

```
app/
  api/
    routes/   # 엔드포인트
    router.py # 라우터 취합
  core/
    config.py # 환경설정 (pydantic-settings)
  main.py     # FastAPI 앱 진입점
tests/
```
