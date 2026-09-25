# frontend — 관제 대시보드 + 고객 반납 화면

React 18 + Vite. 백엔드(`http://localhost:8080`)의 API를 호출한다.

## 실행

```bash
npm ci          # 의존성 설치 (package-lock.json 그대로)
npm run dev     # http://localhost:5173
npm run build   # dist/ 생성
npm run lint    # oxlint
```

## 환경변수

`.env.example`을 `.env`로 복사해서 채운다 (`.env`는 git에 올라가지 않음).

| 변수 | 용도 |
|---|---|
| `VITE_ADMIN_TOKEN` | 차량 상세의 "세차 완료 · 배차 재개" 버튼용. 백엔드 `APP_ADMIN_TOKEN`과 같은 값 |

## 화면

| 경로 | 파일 | 데이터 |
|---|---|---|
| `/` | `pages/Home.jsx` | `GET /vehicles` |
| `/vehicles` | `pages/VehicleList.jsx` | `GET /vehicles` |
| `/vehicles/:id` | `pages/VehicleDetail.jsx` | `GET /vehicles/{plate}`, `POST /vehicles/{plate}/resume` |
| `/analysis`, `/analysis/:id` | `pages/AIAnalysis.jsx` | `GET /vehicles` → `GET /vehicles/{plate}` |
| `/return` | `pages/ReturnAccept.jsx` | `POST /return` (관리자용 반납 접수) |
| `/customer` | `pages/CustomerReturn.jsx` | `POST /return` (고객 모바일 반납) |
| `/login` | `pages/Login.jsx` | 프론트 전용 (백엔드 인증 아님) |
| `/penalty`, `/alert`, `/profile` | `pages/Penalty.jsx` 등 | 화면만 (백엔드 API 없음) |
