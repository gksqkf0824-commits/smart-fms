# API 명세서 (API Spec)

> 이 문서의 JSON 규약이 AI ↔ 백엔드 ↔ 프론트의 "계약서"입니다.

---

## 전체 호출 흐름

우리 시스템엔 서버가 2개 있고, 호출은 한 방향으로 이어집니다.

```
고객 폰 ─┐
         ├─▶ [Spring Boot 백엔드] ─▶ [FastAPI AI 서버]
대시보드 ─┘        (지휘자)              (분석만)
```

- **폰·대시보드**는 **백엔드 API**만 호출합니다. (AI 서버 존재를 몰라도 됨)
- **AI 서버 API**(`/predict`)는 **백엔드만** 호출합니다.
- 그래서 아래 명세는 ①AI 서버 → ②백엔드 순으로 봅니다.

---

## 1. AI 추론 서버 (FastAPI) — 담당: 왕석빈·최지우

> **역할:** "사진 1장 넣으면 → 오염도 숫자를 돌려주는" 순수 분석 함수.
> 배차·DB·알림 같은 건 전혀 몰라도 됩니다. 오직 이미지 → 결과.
> 백엔드가 필요할 때 호출하고, AI는 답만 합니다.

### `POST /predict`
차량 실내 사진을 받아 오염도를 분석해 돌려준다.

**누가 호출?** 백엔드(Spring Boot)가 호출 → 고객 폰은 직접 호출하지 않음
**언제?** 반납 사진이 들어와서 오염 분석이 필요할 때

**Request** (`multipart/form-data`)
| 필드 | 타입 | 설명 |
|---|---|---|
| image | file | (마스킹된) 실내 사진 1장 |

**Response** `200 OK`
```json
{
  "roi_pollution_ratio": 0.20,
  "classes": [
    { "type": "trash", "area_ratio": 0.12 },
    { "type": "spill", "area_ratio": 0.08 }
  ],
  "confidence": 0.91
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `roi_pollution_ratio` | float | **핵심 값.** ROI(시트·바닥) 대비 **합산** 오염 면적 비율. **범위 0.0~1.0** (0.20 = 20%). 화면 표시는 프론트가 ×100 |
| `classes[].type` | string | 오염 종류. `trash`(고형 쓰레기) 또는 `spill`(액체·얼룩) |
| `classes[].area_ratio` | float | 그 종류가 차지한 면적 비율. (trash 12% + spill 8% = 합산 20%) |
| `confidence` | float | 모델이 얼마나 확신하는지 (0~1) |

**왜 이렇게 나눠 주나?**
백엔드는 `roi_pollution_ratio`(합산)로 **등급을 판정**하고,
`classes`(종류별)로 **세부 규칙**을 겁니다. (예: `spill`이 있으면 양이 적어도 세차)
그래서 합산값과 종류별값을 **둘 다** 내려줍니다.

**Error / 예외**
```json
{ "detail": "no_target_detected" }
```
오염이 하나도 없거나 분석 대상을 못 찾으면 위처럼 반환 → 백엔드가 **오염도 0(정상)** 으로 처리.

---

## 2. 백엔드 API (Spring Boot) — 담당: 김주찬·김민아·권소윤(연동)

> **역할:** 전체 흐름의 지휘자. 사진 받기 → 마스킹·S3 저장 → AI 호출 →
> 오염도로 배차·세차·알림 결정 → DB 기록까지 전부 조율.
> 폰과 대시보드는 이 API들만 사용합니다.

---

### `POST /return`  — 반납하기 (가장 중요한 API)

> 이 API 하나가 우리 시스템의 **심장**입니다. 고객이 반납 버튼을 누르면
> 뒤에서 벌어지는 모든 자동화(분석→판정→조치→기록)가 여기서 실행됩니다.

**누가 호출?** 고객 폰 (반납 화면 S2에서 촬영 후)
**언제?** 고객이 실내 사진을 찍어 전송할 때
**내부 동작 순서:**
1. 사진 수신 → 2. 얼굴·번호판 마스킹 → 3. S3 저장 →
4. AI 서버 `POST /predict` 호출 → 5. 오염도로 등급 판정 →
6. 배차 차단·세차·패널티·디스코드 알림 실행 → 7. DB 기록

**Request** (`multipart/form-data`)
| 필드 | 타입 | 설명 |
|---|---|---|
| plate | string | 차량 번호 (예: `12가3456`) |
| image | file | 실내 사진 **원본** (마스킹은 서버가 함) |

**Response** `200 OK` — 이 응답을 고객 화면(S3 결과)에 그대로 보여줌
```json
{
  "vehicle": "12가3456",
  "roi_pollution_ratio": 0.20,
  "classes": [
    { "type": "trash", "area_ratio": 0.12 },
    { "type": "spill", "area_ratio": 0.08 }
  ],
  "grade": "BLOCK",
  "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved", "notified"],
  "image_key": "inspections/2026/12가3456_0941.jpg"
}
```
| 필드 | 설명 |
|---|---|
| `grade` | 최종 등급. `NORMAL`(정상) / `WARN`(경고·패널티) / `BLOCK`(배차차단·세차) |
| `actions` | 실제로 실행된 조치 목록. 프론트는 이걸로 "세차 접수됨" 등 안내 문구 표시 |
| `image_key` | S3에 저장된 사진 경로 (URL 아님, 경로만) |

---

### `GET /vehicles`  — 차량 목록

> 관제 대시보드 첫 화면(D1). 전국 차량이 지금 어떤 상태인지 한 줄씩 보여줌.

**누가 호출?** 대시보드(FE)
**언제?** 관제 화면 진입 시 / 주기적 갱신(폴링)

**Response** `200 OK`
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
| 필드 | 설명 |
|---|---|
| `status` | `AVAILABLE`(운행가능) / `INSPECTING`(검수중) / `CARWASH_NEEDED`(세차필요) |
| `pollution_ratio` | 최근 오염도 (리스트에 바 형태로 표시) |

---

### `GET /vehicles/{plate}`  — 차량 상세

> 대시보드 상세 화면(D2). AI가 뭘 보고 어떤 조치를 했는지 검증하는 화면.

**누가 호출?** 대시보드(FE) — 리스트에서 차량 클릭 시
**언제?** 특정 차량 상세 진입 시

**Response** `200 OK`
```json
{
  "plate": "12가3456",
  "zone": "강남 A존",
  "model": "아이오닉 5",
  "status": "CARWASH_NEEDED",
  "latest_inspection": {
    "roi_pollution_ratio": 0.20,
    "classes": [
      { "type": "trash", "area_ratio": 0.12 },
      { "type": "spill", "area_ratio": 0.08 }
    ],
    "image_url": "https://s3.../presigned...",
    "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved"],
    "checked_at": "2026-01-15T09:41:00"
  }
}
```
> `image_url`은 **presigned URL**(임시 접근 링크). DB엔 경로(`image_key`)만 저장돼 있고,
> 이 API가 호출될 때 그 경로로 임시 URL을 만들어 내려줍니다. → 사진이 아무나 못 보게 보호.

---

### `POST /vehicles/{plate}/resume`  — 배차 재개 (수동)

> AI가 배차를 막았지만, 관리자가 직접 확인하고 "다시 운행 가능"으로 푸는 버튼.

**누가 호출?** 대시보드(FE) — 상세 화면의 '배차 재개' 버튼
**언제?** 관리자가 수동 개입할 때 **(관리자 인증 필요)**

**Response** `200 OK`
```json
{ "plate": "12가3456", "status": "AVAILABLE" }
```

---

## 3. 상태값 정리 (enum) — 팀 전체 통일

> 이 값들은 **철자·대소문자까지 그대로** 써야 합니다.
> 한 명이라도 `carwash_needed`처럼 다르게 쓰면 연동이 깨집니다.

| 구분 | 값 |
|---|---|
| 차량 상태 | `AVAILABLE`, `INSPECTING`, `CARWASH_NEEDED` |
| 오염 등급 | `NORMAL`, `WARN`, `BLOCK` |
| 오염 클래스 | `trash`, `spill` |
| 조치 | `dispatch_blocked`, `carwash_requested`, `penalty_reserved`, `notified` |

---

## 4. 이 명세서 쓰는 법 (팀 공지)

- **AI팀:** `/predict` 응답 JSON을 이 모양 그대로 맞춰주세요. (필드명·타입 고정)
- **백엔드팀:** 위 엔드포인트대로 구현. `/return`이 우선순위 1번.
- **프론트:** 이 응답 구조로 **모킹 데이터**를 만들어 백엔드 없이 화면부터 개발.
- 값(enum)은 위 3번 표를 **복붙**해서 쓰세요. 임의로 만들지 마세요.

## 5. 확정 이력
| 날짜 | 변경 | 담당 |
|---|---|---|
| 2026-08-02 | iou 응답 제외 / 오염도 0~1 확정 | 권소윤 |
