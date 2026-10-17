# Smart FMS — AI 기반 지능형 차량 관제 및 실시간 배차 관리 시스템

> 다음 승객이 문을 열기 전에, AI가 차량 실내 오염을 판단하고
> 배차부터 세차 요청까지 자동으로 처리하는 무인 FMS(Fleet Management System).

카셰어링·무인 모빌리티 차량의 **실내 오염**을 AI로 픽셀 단위 분석하여,
오염도에 따라 **배차 중단 · 차량 Swap · 패널티 · 세차 자동 호출**까지
사람 개입 없이 처리하는 관제 시스템입니다.

---

## 핵심 컨셉

- **BBox(있다/없다)가 아니라 면적(%)** — 오염을 세그멘테이션으로 픽셀 단위 정량화
- **AI로 끝이 아니라 자동화까지** — 오염도 → 비즈니스 액션(배차·세차·알림) 풀사이클
- **엔터프라이즈급 인프라** — 서비스 분리 · CI/CD 무중단 배포 · 개인정보 보호 설계

---

## 팀 & 역할 (6인)

| 이름 | 역할 | 담당 |
|---|---|---|
| **권소윤** | PM · 테크리드 | 전체 아키텍처, API 규약 설계, AI↔백엔드 연동 브릿지, 오염도 등급 로직, 디스코드 알림 |
| **김주찬** | 백엔드 | FMS 비즈니스 로직, PostgreSQL DB 설계, 배차·패널티 API |
| **김민아** | 백엔드 | 클라우드 인프라, Docker·AWS 배포, CI/CD, 보안·개인정보 처리 |
| **왕석빈** | AI | 세그멘테이션 모델링, 데이터 수집·라벨링, 면적 비율 산출 |
| **최지우** | AI | AI 추론 서버(FastAPI) 구축·서빙, 추론 안정화 |
| **신서현** | 프론트엔드 | 관제 대시보드 + 고객 반납 시연 화면 |

---

## 시스템 아키텍처

```
                        ┌──────────── 관제 대시보드 (FE) ◀─┐
                        │                                  │
폰/카메라 ──▶ Spring Boot (지휘자) ──────────────────────┤
              │  ① 사진 수신                              │
              │  ② 얼굴·번호판 마스킹                      │
              │  ③ S3 저장 (마스킹본만)                    │
              │  ④ FastAPI 호출 ──▶ AI 추론 (FastAPI)     │
              │                  ◀── 오염도 JSON ──────────┘
              │  ⑤ 오염도 등급 판정
              │  ⑥ 배차 중단·Swap / 세차 API / 디스코드 알림
              └─ ⑦ PostgreSQL 기록
```

- **이미지 방향:** 백엔드 → AI (백엔드가 사진을 넘김 / AI는 **결과 JSON만** 반환, 이미지 X)
- **이미지 저장:** 이미지 파일은 **S3**에 저장하고, **DB에는 S3 경로(key/URL)만** 문자열로 저장.
  DB에 이미지 바이너리를 직접 넣지 않아 부하를 방지. 조회 시 presigned URL 발급.

---

## 핵심 합의사항

자세한 내용은 [`docs/AGREEMENTS.md`](docs/AGREEMENTS.md) · API 규약은 [`docs/API.md`](docs/API.md)

1. **이미지 플로우 (A안)** — 폰 → Spring Boot 수신 → 마스킹 → S3 저장 → FastAPI 추론 → JSON 반환
2. **이미지 저장** — 파일은 S3, **DB엔 S3 key/URL만** 저장 (BLOB 금지) → DB 부하 방지
3. **개인정보 마스킹** — 백엔드에서 **S3 저장 전** 얼굴·번호판 처리 (원본 미저장). PoC는 개념 설계
4. **오염도** = ROI(시트·바닥) 대비 오염 마스크 픽셀 비율(%). 임계치는 운영 정책값
5. **클래스 2종** — `trash`(고형 쓰레기) / `spill`(액체·얼룩)
6. **모델** — YOLO11-Seg 베이스라인 (Mask R-CNN 비교군), 정확도 검증은 IoU/Dice
7. **AI 서빙** — FastAPI 독립 REST 서버로 분리, 백엔드와 JSON으로 통신
8. **프론트** — 모바일 웹 (네이티브 앱 X). 실제 촬영은 인캐빈 카메라, 시연은 모바일로 대체
9. **알림** — 오염 감지 시 디스코드 Webhook 자동 발송

---

## 기술 스택

| 구분 | 스택 |
|---|---|
| AI / CV | YOLO11-Seg, PyTorch, FastAPI |
| Backend | Java, Spring Boot, Spring JPA |
| Infra | Docker, AWS (EC2·S3), GitHub Actions (CI/CD), Redis |
| DB | PostgreSQL |
| Frontend | React (또는 Vue), 모바일 웹 |
| 알림 | Discord Webhook |

---

## 레포 구조 (모노레포)

```
smart-fms/
├── apps/
│   ├── ai-server/ # FastAPI 추론 서버 (왕석빈, 최지우)
│   ├── backend/   # Spring Boot 비즈니스 API (김주찬, 김민아)
│   └── frontend/  # React 대시보드 + 시연 (신서현)
├── db/            # schema.sql, seed.sql (DB 최초 생성 시 자동 실행)
├── infra/         # EC2 배포 스크립트 (김민아)
├── docs/          # API 명세, ERD, 합의사항
└── docker-compose.yml
```

---

## 브랜치 & 협업 규칙

```
ai / backend / frontend / infra   ← 파트별 작업 브랜치
            │  작업 후 머지
            ▼
        develop                   ← 통합·테스트 (기본 작업 대상)
            │  안정화되면 (막판)
            ▼
         main                     ← 최종 완성본만
```

- **파트별 브랜치**(`ai`/`backend`/`frontend`/`infra`)에서 각자 작업
- 작업분은 **`develop`으로 머지** (통합·테스트는 develop에서)
- `main`은 **최종 완성본만** — 막판에 `develop → main`
- 가끔 `git merge develop`으로 최신 반영 (충돌 예방)
- 커밋 금지: 모델 가중치(`.pt`), 데이터셋, `.env` → `.gitignore` 확인

---

## 실행

전체 구성은 **DB(5432) → 백엔드(8080) → AI 서버(8000) → 프론트(5173)** 이다.
AI 서버 없이도 백엔드가 가짜 결과(StubAiClient)로 동작하므로, 처음엔 **빠른 실행**으로 확인하고 필요할 때 AI 서버를 붙인다.

**필요한 것:** Docker Desktop, Node.js 20.19+ 또는 22.12+, (AI 서버를 돌릴 때) Python 3.13 + [uv](https://docs.astral.sh/uv/)

### 빠른 실행 — AI 서버 없이 (DB + 백엔드 + 프론트)

```bash
# 1. DB + 백엔드 (루트에서)
docker compose up --build        # 처음엔 이미지 빌드로 몇 분 걸림

# 2. 프론트 (새 터미널)
cd apps/frontend
npm ci
npm run dev
```

- 대시보드: http://localhost:5173 · 고객 반납 화면: http://localhost:5173/customer
- 백엔드 API: http://localhost:8080/vehicles
- `.env`가 없어도 실행된다. 이때 AI는 가짜 결과, 사진은 경로만 생성(S3 미사용), 알림은 로그로 대체된다.

### 전체 실행 — 실제 AI 모델 포함

**1. 환경변수 준비** (각 `.env`는 git에 올라가지 않음)

```bash
cp .env.example .env                              # 루트: 백엔드용
cp apps/frontend/.env.example apps/frontend/.env  # 프론트용
```

루트 `.env`에서 최소한 아래를 설정한다. S3·디스코드는 키가 없으면 `false`로 둔다.

| 변수 | 값 | 용도 |
|---|---|---|
| `APP_AI_ENABLED` | `true` | 실제 AI 서버 호출 |
| `APP_AI_BASE_URL` | `http://host.docker.internal:8000` | 백엔드(Docker 안) → AI 서버(내 PC) 주소 |
| `APP_ADMIN_TOKEN` | 아무 문자열 | 배차 재개 API 인증 |
| `APP_S3_ENABLED` / `APP_DISCORD_ENABLED` | `false` | 키가 없으면 끔 |

프론트 `apps/frontend/.env`의 `VITE_ADMIN_TOKEN`에는 `APP_ADMIN_TOKEN`과 **같은 값**을 넣는다.

**2. AI 서버** — 모델 가중치(`.pt`)는 git에 없으므로 먼저 받는다 ([apps/ai-server/README.md](apps/ai-server/README.md)의 "가중치 받기").

```bash
cd apps/ai-server
uv sync                                       # 처음엔 torch 설치로 오래 걸림
uv run uvicorn app.main:app --port 8000       # 시작 시 모델 워밍업 약 7초
```

**3. DB + 백엔드** (루트에서, AI 서버가 뜬 뒤)

```bash
docker compose up --build
```

**4. 프론트** — 빠른 실행의 2번과 같다.

**5. 확인:** http://localhost:5173/customer 에서 차량번호(예: `12가3456`)와 실내 사진으로 반납 → 대시보드 차량 상세에서 판정 결과 확인 → 세차 필요 차량은 "세차 완료 · 배차 재개"

### 자주 막히는 곳

| 증상 | 원인 · 해결 |
|---|---|
| 반납이 `503 ai_unavailable` | `APP_AI_ENABLED=true`인데 AI 서버가 꺼져 있거나 주소가 틀림. 백엔드를 Docker 없이 띄웠다면 주소는 `http://localhost:8000` |
| `db/schema.sql`을 고쳤는데 반영 안 됨 | 초기화 스크립트는 DB를 처음 만들 때만 돈다 → `docker compose down -v` 후 다시 `up` (**DB 데이터 삭제됨**) |
| 백엔드 기동 시 스키마 검증 오류 | 위와 같음. 예전에 만든 DB 볼륨이 옛 스키마를 갖고 있음 |
| "배차 재개"가 `관리자 인증에 실패` | 백엔드 `APP_ADMIN_TOKEN`과 프론트 `VITE_ADMIN_TOKEN`이 다름. 프론트 `.env`를 바꿨으면 `npm run dev` 재시작 |
| 코드를 고쳤는데 백엔드에 반영 안 됨 | `docker compose up --build`로 이미지 다시 빌드 |

파트별 상세(로컬 실행·테스트): [backend](apps/backend/README.md) · [ai-server](apps/ai-server/README.md) · [frontend](apps/frontend/README.md)
