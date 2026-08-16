# API 명세서 (API Spec)

> 이 문서의 JSON 규격이 AI ↔ 백엔드 → 프론트의 **"계약서"**입니다. 여기 적힌 필드명·타입·enum 값은 팀 전체가 그대로 따릅니다.

---

## 전체 호출 흐름

```
고객 → [Spring Boot 백엔드]  ──→  [FastAPI AI 서버]
       (관제·대시보드)              (추론용)
```

- 프론트·대시보드는 백엔드 API만 호출함 (AI 서버 존재는 몰라도 됨)
- 백엔드는 AI 서버 API(`/predict`)를 백엔드만 호출함
- 아래 명세는 **① AI 서버 → ② 백엔드** 순으로 정리합니다.

---

## 1. AI 추론 서버 (FastAPI) — 담당: 왕석빈·최지우

역할: "사진 1장 넣으면 오염도 숫자만 던져주는" 순수 분석 함수다. 배차·DB·알림 같은 건 전혀 몰라도 된다. 오직 이미지만 받고 → 결과만 내주는 담당만 한다.

### `POST /predict`

차량 실내 사진을 받아 오염도를 분석해 돌려준다.

**누가 호출?** 백엔드(Spring Boot)가 호출 ← 고객은 직접 호출하지 않음
**언제?** 반납 사진이 들어와서 오염도 분석이 필요할 때

#### Request

| 항목 | 값 |
|---|---|
| Method | `POST` |
| Content-Type | `multipart/form-data` |
| Timeout 권장값 | 5초 (모델 추론 지연 대비 백엔드 측 타임아웃 설정 권장) |

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
|---|---|---|---|---|
| `image` | file | ✅ | jpg/png, 최대 10MB, 최소 해상도 640×480 | (마스킹된) 실내 사진 1장 |

#### Response `200 OK`

```json
{
  "roi_pollution_ratio": 0.27,
  "classes": [
    { "type": "trash", "area_ratio": 0.12 },
    { "type": "occupy", "area_ratio": 0.07 },
    { "type": "spill", "area_ratio": 0.08 }
  ],
  "confidence": 0.91
}
```

| 필드 | 타입 | 필수 | 범위/형식 | 설명 |
|---|---|---|---|---|
| `roi_pollution_ratio` | float | ✅ | 0.00 ~ 1.00, 소수점 둘째 자리 반올림 | 핵심 값. ROI(시트·바닥) 대비 합산 오염 면적 비율. `classes[]`의 `area_ratio` 합과 동일. 화면 표시는 프론트가 ×100 |
| `classes` | array | ✅ | 탐지 없으면 빈 배열 아님 — `no_target_detected` 예외로 대체 (아래 참고) | 오염 종류별 상세. 최대 3개 항목(`trash`/`occupy`/`spill`), 탐지 안 된 종류는 배열에서 생략 |
| `classes[].type` | string | ✅ | `trash` \| `occupy` \| `spill` (3번 enum 표 참고) | 오염 종류. 아래 **모델 매핑 표** 참고 |
| `classes[].area_ratio` | float | ✅ | 0.00 ~ 1.00 | 그 종류가 차지한 면적 비율. `classes[].area_ratio`의 합 = `roi_pollution_ratio` |
| `confidence` | float | ✅ | 0.00 ~ 1.00 | 모델이 얼마나 확신하는지. **두 모델(객체형·영역형) confidence의 평균값**으로 산정 (2026-08-16 AI팀 확정) |

> **왜 이렇게 나눠 주나**: 백엔드는 `roi_pollution_ratio`(합산)로 등급을 판정하고, `classes`(종류)로 세부 규칙을 건다. (예: `spill`이 있으면 오염값과 종류·비중을 다 내려준다.)

#### `classes[].type` ↔ 모델 매핑

내부적으로는 모델 2개(객체형·영역형)가 따로 추론하고, 그 결과를 아래 규칙으로 합쳐서 `classes[]`를 만든다.

| type | 담당 모델 | 원본 클래스 | 의미 |
|---|---|---|---|
| `trash` | 객체형 모델 | `trash`, `cup`, `bottle`, `can` 등 명확히 식별된 쓰레기 클래스 합산 | 명확한 쓰레기(포장지, 컵, 병, 캔 등) |
| `occupy` | 객체형 모델 | 위 쓰레기 클래스에 속하지 않지만 좌석에 물체가 감지된 경우 | 좌석 점유 — 개인 소지품 등 쓰레기로 단정할 수 없는 물체 |
| `spill` | 영역형 모델 | `stain` 등 오염 영역 클래스 | 액체·얼룩성 오염 |

#### Response — 예외 케이스

| 상황 | 응답 |
|---|---|
| 오염 요소가 하나도 탐지되지 않음 | `200 OK` + `{ "detail": "no_target_detected" }` → 백엔드가 오염도 0(정상)으로 처리 |
| `image` 필드 누락 | `422 Unprocessable Entity` + `{ "detail": "image field required" }` |
| 지원하지 않는 파일 형식(jpg/png 외) | `400 Bad Request` + `{ "detail": "unsupported_image_format" }` |
| 모델 추론 중 서버 오류 | `500 Internal Server Error` + `{ "detail": "inference_failed" }` |
| 모델 콜드 스타트(기동 직후) | `503 Service Unavailable` + `{ "detail": "model_warming_up" }` — 백엔드는 재시도 권장 |

---

## 2. 백엔드 API (Spring Boot) — 담당: 김주찬·김민아·권소윤(연동)

역할: 전체 플로우의 최전선. 사진 받기 → 마스킹 → S3 저장 → AI 호출 → 오염도로 배차·세차 결정 → DB 기록까지 전부 조율한다. 프론트·대시보드는 이 API만 사용한다.

### `POST /return` — 반납하기 (가장 중요한 API)

이 API 하나가 우리 시스템의 심장입니다. 고객이 반납 버튼을 누르면 뒤에서 벌어지는 모든 자동화(분석→판정→조치→기록)가 여기서 시작됩니다.

**누가 호출?** 고객(반납 화면 S2에서 호출) **언제?** 고객이 실내 사진을 찍어 전송할 때

**내부 동작 순서**:
1. 사진 수신 → 얼굴/번호판 마스킹 → S3 저장
2. AI 서버 `POST /predict` 호출 → 오염도 분석
3. 오염도로 등급 판정 → 배차 차단/세차/패널티/디스코드 웹훅 실행 → DB 기록

#### Request

| 항목 | 값 |
|---|---|
| Method | `POST` |
| Content-Type | `multipart/form-data` |

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
|---|---|---|---|---|
| `plate` | string | ✅ | `NN가NNNN` 형식 (예: 12가3456) | 차량 번호 |
| `image` | file | ✅ | jpg/png, 최대 10MB | 실내 사진 원본 (마스킹은 서버가 함) |

#### Response `200 OK` — 이 응답을 고객 화면(S3 결과)에 그대로 보여줌

```json
{
  "vehicle": "12가3456",
  "roi_pollution_ratio": 0.27,
  "classes": [
    { "type": "trash", "area_ratio": 0.12 },
    { "type": "occupy", "area_ratio": 0.07 },
    { "type": "spill", "area_ratio": 0.08 }
  ],
  "grade": "BLOCK",
  "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved", "notified"],
  "image_key": "inspections/2026/12가3456_0941.jpg"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `vehicle` | string | ✅ | 요청받은 `plate` 그대로 반환 |
| `grade` | string | ✅ | 최종 등급. `NORMAL`(정상) / `WARN`(경고·관찰) / `BLOCK`(배차차단·세차) |
| `actions` | array | ✅ | 실제로 실행한 조치 목록 (빈 배열 가능 — NORMAL이면 보통 빈 배열). 프론트는 이걸로 "세차 접수됨" 등 안내 표시 |
| `image_key` | string | ✅ | S3에 저장된 사진 경로 (URL 아님, 경로만) |

#### Response — 예외 케이스

| 상황 | 응답 |
|---|---|
| `plate` 형식 오류 | `400 Bad Request` + `{ "detail": "invalid_plate_format" }` |
| AI 서버(`/predict`) 응답 없음/타임아웃 | `504 Gateway Timeout` — 프론트는 "잠시 후 다시 시도해주세요" 안내, 재시도 버튼 노출 |
| AI 서버가 `no_target_detected` 반환 | 오염도 0으로 간주, `grade: "NORMAL"`, `actions: []` 로 정상 처리 |
| S3 업로드 실패 | `500 Internal Server Error` + `{ "detail": "storage_failed" }` |

---

### `GET /vehicles` — 차량 목록

관제 대시보드 첫 화면(D1). 전체 차량이 지금 어떤 상태인지 한 줄씩 보여줌.

**누가 호출?** 대시보드(FE) **언제?** 관제 화면 진입 시 / 주기적 갱신(폴링, 권장 주기 30초)

#### Request

| 항목 | 값 |
|---|---|
| Method | `GET` |
| Query Parameter | `zone` (선택) — 특정 구역만 필터링, 미지정 시 전체 반환 |

#### Response `200 OK`

```json
[
  {
    "plate": "12가3456",
    "zone": "강남 A존",
    "status": "CARWASH_NEEDED",
    "pollution_ratio": 0.20,
    "last_checked": "2026-01-15T09:41:00"
  }
]
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `status` | string | ✅ | `AVAILABLE`(운행가능) / `INSPECTING`(검수중) / `CARWASH_NEEDED`(세차필요) |
| `pollution_ratio` | float | ✅ | 최근 오염도 (리스트에 바 형태로 표시) |
| `last_checked` | string (ISO 8601) | ✅ | 최근 검수 시각. 검수 이력이 없으면 `null` |

빈 배열(`[]`)도 정상 응답 — 해당 zone에 차량이 없는 경우.

---

### `GET /vehicles/{plate}` — 차량 상세

대시보드 상세 화면(D2). AI가 뭘 보고 어떤 조치를 했는지 검증하는 화면.

**누가 호출?** 대시보드(FE) — 리스트에서 차량 클릭 시 **언제?** 특정 차량 상세 진입 시

#### Response `200 OK`

```json
{
  "plate": "12가3456",
  "zone": "강남 A존",
  "model": "아이오닉 5",
  "status": "CARWASH_NEEDED",
  "latest_inspection": {
    "roi_pollution_ratio": 0.27,
    "classes": [
      { "type": "trash", "area_ratio": 0.12 },
      { "type": "occupy", "area_ratio": 0.07 },
      { "type": "spill", "area_ratio": 0.08 }
    ],
    "image_url": "https://s3.../presigned...",
    "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved"],
    "checked_at": "2026-01-15T09:41:00"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `latest_inspection` | object \| null | ✅ | 최근 검수 결과. 검수 이력이 없는 신규 차량은 `null` |
| `image_url` | string | ✅ (검수 이력 있을 때) | **presigned URL(임시 접근 링크)**. DB엔 `image_key`만 저장돼 있고, 이 API가 호출될 때 그 경로로 임시 URL을 만들어 내려준다 → 사진이 아무나 못 보게 보호. 만료 시간 권장: 10분 |

#### Response — 예외 케이스

| 상황 | 응답 |
|---|---|
| 존재하지 않는 `plate` | `404 Not Found` + `{ "detail": "vehicle_not_found" }` |

---

### `POST /vehicles/{plate}/resume` — 배차 재개 (수동)

AI가 배차를 막았지만, 관리자가 직접 확인하고 "다시 운행 가능"으로 두는 버튼.

**누가 호출?** 대시보드(FE) — 상세 화면의 '배차 재개' 버튼 **언제?** 관리자가 수동 개입할 때

#### Request

| 항목 | 값 |
|---|---|
| Method | `POST` |
| 인증 | **관리자 인증 필요** (Authorization 헤더, 세부 방식은 백엔드팀 확정 예정) |

#### Response `200 OK`

```json
{ "plate": "12가3456", "status": "AVAILABLE" }
```

#### Response — 예외 케이스

| 상황 | 응답 |
|---|---|
| 인증 실패/권한 없음 | `403 Forbidden` + `{ "detail": "admin_auth_required" }` |
| 이미 `AVAILABLE` 상태인 차량 | `409 Conflict` + `{ "detail": "already_available" }` |
| 존재하지 않는 `plate` | `404 Not Found` + `{ "detail": "vehicle_not_found" }` |

---

## 3. 상태값 정리 (enum) — 팀 전체 통일

이 값들은 철자·대소문자까지 그대로 써야 합니다. 한 명이라도 `carwash_needed`처럼 다르게 쓰면 연동이 깨집니다.

| 구분 | 값 |
|---|---|
| 차량 상태 | `AVAILABLE`, `INSPECTING`, `CARWASH_NEEDED` |
| 오염 등급 | `NORMAL`, `WARN`, `BLOCK` |
| 오염 종류 | `trash`, `occupy`, `spill` |
| 조치 | `dispatch_blocked`, `carwash_requested`, `penalty_reserved`, `notified` |

### 등급(`grade`) 판정 기준 — 백엔드 확정 필요 (초안)

| grade | 조건 (예시, 팀 협의로 확정 필요) |
|---|---|
| `NORMAL` | `roi_pollution_ratio` < 0.05 |
| `WARN` | 0.05 ≤ `roi_pollution_ratio` < 0.20 |
| `BLOCK` | `roi_pollution_ratio` ≥ 0.20 |

> ⚠️ 이 임계값은 AI팀 초안이며 실제 값은 PM·백엔드 협의로 최종 확정한다. 확정 즉시 5번 확정 이력에 반영.

---

## 4. 이 명세서 쓰는 법 (팀 공지)

- **AI팀**: `/predict` 응답 JSON은 이 모양 그대로 맞춰주세요. (필드명 타이핑 고정, 대소문자까지 동일하게)
- **백엔드팀**: 위 엔드포인트대로 구현. `/return`이 우선순위 1번.
- **프론트**: 이 응답 구조로 목업 데이터를 만들어 백엔드 없이 화면부터 개발.
- **값(enum)은 위 3번 표를 복붙해서 쓰세요.** 임의로 만들지 마세요.
- **에러 응답의 `detail` 문자열도 위 표(1·2번 섹션)의 값을 그대로 씁니다.** 프론트가 이 문자열로 안내 메시지를 분기하므로 임의로 바꾸지 않습니다.

---

## 5. 확정 이력

| 날짜 | 변경 | 담당 |
|---|---|---|
| 2026-08-02 | IoU 응답 제외 / 오염도 0~1 확정 | 권소윤 |
| 2026-08-16 | 에러 응답 코드·케이스 세분화, 필드별 타입·제약 명시, `confidence` 산정 방식(두 모델 평균) 확정 | 최지우 |
| 2026-08-16 | `classes[].type`에 `occupy` 추가 (trash/occupy/spill 3종 체계로 확장), 모델 2개 결과 매핑 규칙 명시 — **occupy 판정 기준은 팀 재확인 필요** | 최지우 |
