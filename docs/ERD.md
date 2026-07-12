# 데이터베이스 설계 (ERD)

> PostgreSQL 기준. 담당: 김주찬 (스키마 설계) · 백엔드팀 공용.
> 변경 시 이 문서부터 수정 후 팀 공유.

---

## 테이블 한눈에 보기

```
users (이용자)
   │ 1
   │        ┌──────────────┐
   └───────<│ penalties     │ (패널티 내역)
            └──────────────┘
                   │ N
                   │
vehicles (차량) 1──< inspections (반납 검수) >──1 (오염 결과 포함)
   │ 1                    │ 1
   └──< dispatches        └──< carwash_requests (세차 요청)
        (배차 이력)
```

- 핵심은 **inspections(반납 검수)** 테이블. 반납 1건 = 이 테이블 1행.
- 오염 분석 결과·조치·사진 경로가 모두 여기에 연결됨.

---

## 1. users — 이용자

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 이용자 ID |
| name | VARCHAR(50) | 이름 |
| phone | VARCHAR(20) | 연락처 |
| penalty_points | INT | 누적 패널티 점수 (기본 0) |
| created_at | TIMESTAMP | 가입일 |

---

## 2. vehicles — 차량

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 내부 ID |
| plate | VARCHAR(20) UNIQUE | 차량 번호 (예: 12가3456) |
| model | VARCHAR(50) | 모델명 |
| zone | VARCHAR(50) | 배치 존 (예: 강남 A존) |
| status | VARCHAR(20) | `AVAILABLE` / `INSPECTING` / `CARWASH_NEEDED` |
| updated_at | TIMESTAMP | 상태 변경 시각 |

> `status`는 `AGREEMENTS.md`·`API.md`의 enum과 **철자 통일**.

---

## 3. inspections — 반납 검수 (핵심 테이블)

> 반납 1건마다 1행 생성. AI 오염 분석 결과를 저장.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 검수 ID |
| vehicle_id | BIGINT FK → vehicles | 대상 차량 |
| user_id | BIGINT FK → users | 반납한 이용자 (직전 이용자) |
| roi_pollution_ratio | NUMERIC(4,3) | 합산 오염도 (0.000~1.000) |
| trash_ratio | NUMERIC(4,3) | 고형 쓰레기 면적 비율 |
| spill_ratio | NUMERIC(4,3) | 액체·얼룩 면적 비율 |
| grade | VARCHAR(10) | `NORMAL` / `WARN` / `BLOCK` |
| iou | NUMERIC(4,3) | 면적 정확도 (검증용) |
| image_key | VARCHAR(255) | **S3 경로만 저장** (이미지 바이너리 X) |
| created_at | TIMESTAMP | 반납·검수 시각 |

> ⚠️ **image_key는 S3 경로 문자열만.** 이미지 파일 자체는 절대 DB에 넣지 않음 (부하 방지).
> 조회 시 이 경로로 presigned URL 발급.

---

## 4. dispatches — 배차 이력

> 어떤 이용자가 어떤 차량을 언제 빌렸는지 + 배차 차단/Swap 기록.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 배차 ID |
| vehicle_id | BIGINT FK → vehicles | 대상 차량 |
| user_id | BIGINT FK → users | 배차받은 이용자 |
| status | VARCHAR(20) | `RESERVED` / `IN_USE` / `RETURNED` / `BLOCKED` / `SWAPPED` |
| swapped_to | BIGINT NULL | Swap된 경우 대체 차량 ID |
| created_at | TIMESTAMP | 배차 시각 |

---

## 5. carwash_requests — 세차 요청

> 오염도 초과로 세차가 자동 호출된 기록.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 요청 ID |
| vehicle_id | BIGINT FK → vehicles | 대상 차량 |
| inspection_id | BIGINT FK → inspections | 트리거된 검수 |
| partner | VARCHAR(50) | 세차 업체 (예: 강남 세차연합) |
| status | VARCHAR(20) | `REQUESTED` / `DONE` |
| created_at | TIMESTAMP | 요청 시각 |

---

## 6. penalties — 패널티 내역

> 오염 반납 시 직전 이용자에게 부과.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | 패널티 ID |
| user_id | BIGINT FK → users | 대상 이용자 |
| inspection_id | BIGINT FK → inspections | 근거 검수 |
| points | INT | 부과 점수 |
| reason | VARCHAR(100) | 사유 (예: 오염도 20%) |
| created_at | TIMESTAMP | 부과 시각 |

---

## 관계 요약

- `vehicles` 1 : N `inspections` (차량 1대가 여러 번 반납·검수됨)
- `inspections` 1 : N `carwash_requests` / `penalties` (검수 1건이 조치들을 유발)
- `users` 1 : N `penalties` (이용자 1명이 여러 패널티)
- `vehicles` 1 : N `dispatches` (차량 1대가 여러 번 배차)

## 설계 메모
- 오염 분석의 클래스가 2종(`trash`/`spill`)이라 컬럼 2개로 단순화. 클래스가 늘면
  별도 `inspection_classes` 테이블로 분리.
- 시연 범위에선 users·dispatches를 더미로 최소화해도 됨. 핵심은 inspections + 조치.
