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
│   ├── ai/        # FastAPI 추론 서버 (왕석빈, 최지우)
│   ├── backend/   # Spring Boot 비즈니스 API (김주찬, 김민아)
│   └── web/       # React 대시보드 + 시연 (신서현)
├── infra/         # docker-compose, CI/CD, 배포 (김민아)
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

```bash
docker-compose up   # 전체 로컬 실행
# 개별 실행은 각 apps/*/README.md 참고
```
