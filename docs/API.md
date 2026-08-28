# API 명세서 (API Spec)

> 이 문서의 JSON 규약이 AI ↔ 백엔드 ↔ 프론트의 "계약서"입니다.
> **모델 2개(Detection + Segmentation)** 구조를 반영한 버전. 필드명·값 형식은 기존] 유지.
---

## 전체 호출 흐름

우리 시스템엔 서버가 2개 있고, 호출은 한 방향으로 이어집니다.

```
고객 폰 ─┐
         ├─▶ [Spring Boot 백엔드] ─▶ [FastAPI AI 서버 (모델 2개)]
대시보드 ─┘        (지휘자)              (분석만)
```

- **폰·대시보드**는 **백엔드 API**만 호출합니다. (AI 서버 존재를 몰라도 됨)
- **AI 서버 API**(`/predict`)는 **백엔드만** 호출합니다.
- 그래서 아래 명세는 ①AI 서버 → ②백엔드 순으로 봅니다.

---

## 1. AI 추론 서버 (FastAPI) — 담당: 왕석빈·권소윤

> **역할:** "사진 1장 넣으면 → 분석 결과(raw 값)를 돌려주는" 순수 분석 함수.
> 배차·DB·알림 같은 건 전혀 몰라도 됩니다. 오직 이미지 → 결과.
> **등급(grade) 판정은 하지 않습니다.** raw 값만 반환하고, 판정은 백엔드가 합니다.

**모델 2개를 동시 구동:**

| 모델 | 파일 | 감지 | 방식 |
| --- | --- | --- | --- |
| Detection | `trash_occupy_detection_best.pt` | `trash`(쓰레기), `occupy`(소지품/유실물) | 박스 — **개수·크기** |
| Segmentation | `stain_seg.pt` | `spill`(오염) | 마스크 — **면적 비율** |

### `POST /predict`

차량 실내 사진을 받아 2개 모델로 분석해 raw 값을 돌려준다.

**누가 호출?** 백엔드(Spring Boot)가 호출 → 고객 폰은 직접 호출하지 않음
**언제?** 반납 사진이 들어와서 분석이 필요할 때

**Request** (`multipart/form-data`)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| image | file | (마스킹된) 실내 사진 1장 |

**Response** `200 OK`

```json
{
  "roi_pollution_ratio": 0.08,
  "trash_count": 3,
  "trash_large": false,
  "occupy_detected": true,
  "confidence": 0.91
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `roi_pollution_ratio` | float | **spill 오염 면적 비율 (0.0~1.0).** Segmentation(`stain_seg.pt`) 결과 = 오염 픽셀 / ROI 전체 픽셀. (0.08 = 8%). ※ 값은 0~1로 반환, 화면 %는 표시할 때 ×100 |
| `trash_count` | int | 감지된 쓰레기 개수. Detection(`trash_occupy_detection_best.pt`) |
| `trash_large` | bool | ROI의 1% 이상 차지하는 **대형 쓰레기** 존재 여부. Detection |
| `occupy_detected` | bool | 소지품/유실물 감지 여부. Detection → 이전 탑승자 알림용 |
| `confidence` | float | 모델 신뢰도 (0~1). Detection은 0.6 이상만 유효 객체로 취급 |

**왜 이렇게 나눠 주나?**
쓰레기·소지품은 **개수·크기**(Detection)로, 오염은 **면적**(Segmentation)으로 성격이 달라서 따로 반환합니다.
백엔드가 이 raw 값들을 받아 **등급(grade)을 판정**합니다. (판정 규칙은 아래 2번)

**Error / 예외**

```json
{ "detail": "no_target_detected" }
```

아무것도 감지 못 하면 위처럼 반환 → 백엔드가 **정상(NORMAL)** 으로 처리.

---

## 2. 등급 판정 로직 (백엔드가 계산)

> AI가 준 raw 값 → 백엔드가 `grade`로 변환. **임계치는 운영 정책값**이라 코드 설정값으로 분리(하드코딩 금지).
> 쓰레기(개수)와 오염(면적)은 **독립 평가 후 더 심각한 상태로 통합(Overriding).**

### Track 1 — 쓰레기 (`trash_count`, `trash_large`)

| 조건 | 판정 |
| --- | --- |
| `trash_large == true` (대형 1개 이상) | `BLOCK` |
| `trash_count >= 3` | `BLOCK` |
| `trash_count` 1~2개 (대형 아님) | `WARN` |
| 없음 | `NORMAL` |

### Track 2 — 오염 (`roi_pollution_ratio`, 0~1)

| 조건 | 판정 |
| --- | --- |
| `>= 0.05` (5% 이상) | `BLOCK` |
| `0.02 ~ 0.05` (2~5%) | `WARN` |
| `< 0.02` | `NORMAL` (노이즈·조명 반사 마진) |

### 통합 규칙
1. **기본: Overriding** — Track 1·Track 2 중 **더 심각한 상태**를 최종 `grade`로.
   (심각도: `BLOCK` > `WARN` > `NORMAL`)
2. **보완 한 줄** — 둘 다 `WARN`이면 최종 `WARN`. (각각은 통과지만 합치면 지저분한 차를 놓치지 않기 위함)

### 소지품 (`occupy_detected`)
- **grade에는 영향 없음.** `true`이면 `user_alert=true`로만 설정해 이전 탑승자에게 유실물 알림.

---

## 3. 백엔드 API (Spring Boot) — 담당: 김주찬·김민아·권소윤(연동)

> **역할:** 전체 흐름의 지휘자. 사진 받기 → 마스킹·S3 저장 → AI 호출 →
> raw 값으로 등급 판정 → 배차·세차·알림 결정 → DB 기록.
> ⚠️ **2모델 구조 반영으로 응답 필드가 바뀜** (기존 `classes[]` → `trash_count`/`occupy_detected` 등). 백엔드 수정 필요.
---

### `POST /return` — 반납하기 (가장 중요한 API)

> 고객이 반납 버튼을 누르면 뒤에서 벌어지는 모든 자동화가 여기서 실행됩니다.

**누가 호출?** 고객 폰 (반납 화면 S2에서 촬영 후)
**내부 동작:** 사진 수신 → 마스킹 → S3 저장 → `POST /predict` 호출 → 등급 판정 → 배차차단·세차·패널티·알림 → DB 기록

**Request** (`multipart/form-data`)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| plate | string | 차량 번호 (예: `12가3456`) |
| image | file | 실내 사진 **원본** (마스킹은 서버가 함) |

**Response** `200 OK` — 고객 결과 화면(S3)에 그대로 표시

```json
{
  "vehicle": "12가3456",
  "roi_pollution_ratio": 0.08,
  "trash_count": 3,
  "occupy_detected": true,
  "grade": "BLOCK",
  "user_alert": true,
  "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved", "user_alerted", "notified"],
  "image_key": "inspections/2026/12가3456_0941.jpg"
}
```

| 필드 | 설명 |
| --- | --- |
| `grade` | 최종 등급. `NORMAL`(정상) / `WARN`(경고·세차예약) / `BLOCK`(배차차단·세차) |
| `user_alert` | 유실물 감지 → 이전 탑승자 알림 여부 |
| `actions` | 실제 실행된 조치 목록 |
| `image_key` | S3에 저장된 사진 경로 (URL 아님, 경로만) |

---

### `GET /vehicles` — 차량 목록 (대시보드 D1)

**Response** `200 OK`

```json
[
  {
    "plate": "12가3456",
    "zone": "강남 A존",
    "status": "CARWASH_NEEDED",
    "roi_pollution_ratio": 0.08,
    "last_checked": "2026-01-15T09:41:00"
  }
]
```

| 필드 | 설명 |
| --- | --- |
| `status` | `AVAILABLE`(운행가능) / `INSPECTING`(검수중) / `CARWASH_NEEDED`(세차필요) |
| `roi_pollution_ratio` | 최근 오염도 (0~1, 리스트에 바 형태로 표시) |

---

### `GET /vehicles/{plate}` — 차량 상세 (대시보드 D2)

**Response** `200 OK`

```json
{
  "plate": "12가3456",
  "zone": "강남 A존",
  "model": "아이오닉 5",
  "status": "CARWASH_NEEDED",
  "latest_inspection": {
    "roi_pollution_ratio": 0.08,
    "trash_count": 3,
    "occupy_detected": true,
    "grade": "BLOCK",
    "user_alert": true,
    "image_url": "https://s3.../presigned...",
    "actions": ["dispatch_blocked", "carwash_requested", "penalty_reserved"],
    "checked_at": "2026-01-15T09:41:00"
  }
}
```
> `image_url`은 **presigned URL**(임시 접근 링크). DB엔 경로(`image_key`)만 저장되고, 조회 시 임시 URL을 발급 → 사진 보호.
---

### `POST /vehicles/{plate}/resume` — 배차 재개 (수동, 관리자 인증)

```json
{ "plate": "12가3456", "status": "AVAILABLE" }
```

---

## 4. 상태값 정리 (enum) — 팀 전체 통일

> **철자·대소문자까지 그대로** 써야 합니다. 하나라도 다르면 연동이 깨집니다.

| 구분 | 값 |
| --- | --- |
| 차량 상태 (status) | `AVAILABLE`, `INSPECTING`, `CARWASH_NEEDED` |
| 오염 등급 (grade) | `NORMAL`, `WARN`, `BLOCK` |
| Detection 클래스 | `trash`, `occupy` |
| Segmentation 클래스 | `spill` |
| 조치 (actions) | `dispatch_blocked`, `carwash_requested`, `penalty_reserved`, `user_alerted`, `notified` |

---

## 5. 값 형식 규칙

- `roi_pollution_ratio`·`confidence` 등 비율 값은 **모두 0.0~1.0**으로 주고받음.
- 화면에 `%`로 보여줄 땐 **표시하는 쪽(프론트)이 ×100.** (예: 0.08 → "8%")
- AI 서버가 내부에서 ×100해서 계산하더라도, **반환값은 0~1로 맞춰서** 반환.

---

## 6. 이 명세서 쓰는 법 (팀 공지)

- **AI팀:** `/predict` 응답을 이 JSON 모양 그대로. 2모델(det+seg) 결과를 위 필드로 반환. `grade`는 안 넣음(백엔드가 계산).
- **백엔드팀:** raw 값 받아 2번 판정 로직으로 `grade` 계산 → 조치 실행. 기존 `classes[]` 파싱을 `trash_count`/`trash_large`/`occupy_detected`/`roi_pollution_ratio`로 **수정 필요.**
- **프론트:** 이 구조로 모킹 데이터 만들어 화면 개발. `roi_pollution_ratio`는 ×100해서 % 표시.
- enum은 4번 표 **복붙**해서 사용.

## 7. 확정 이력

| 날짜 | 변경 | 담당 |
| --- | --- | --- |
| 2026-08-02 | iou 응답 제외 / 오염도 0~1 확정 | 권소윤 |
| 2026-08-29 | 2모델(Detection+Segmentation) 구조 반영. `classes[]` → `trash_count`/`trash_large`/`occupy_detected` + `roi_pollution_ratio`(spill). 필드명·0~1 값 형식 유지. `occupy`/`user_alert` 추가 | 권소윤 |
