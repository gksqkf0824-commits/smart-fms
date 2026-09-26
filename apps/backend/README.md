# backend — Spring Boot 비즈니스 API

반납 사진을 받아 AI 호출 → 등급 판정 → 배차 차단·Swap / 세차 / 패널티 / 알림 → DB 기록까지 조율한다.
Java 21 (로컬에 없으면 Gradle이 자동으로 받음), Spring Boot 4, PostgreSQL.

## 실행

### Docker로 (권장 — 루트에서)

```bash
docker compose up --build    # DB + 백엔드, http://localhost:8080
```

### Docker 없이 로컬에서 (코드 수정하며 빠르게 확인할 때)

DB만 Docker로 띄우고 백엔드는 Gradle로 실행한다.

```bash
docker compose up -d database          # 루트에서, PostgreSQL만
cd apps/backend
./gradlew bootRun                      # Windows: gradlew.bat bootRun
```

로컬 실행은 루트 `.env`를 자동으로 읽지 않는다. 필요한 설정은 환경변수로 넘긴다.

```bash
APP_AI_ENABLED=true APP_AI_BASE_URL=http://localhost:8000 APP_ADMIN_TOKEN=dev ./gradlew bootRun
```

## 테스트

```bash
./gradlew test
```

- Docker·PostgreSQL 없이 돈다. DB는 H2(PostgreSQL 호환 모드)에 실제 `db/schema.sql`을 올려 쓴다
  (`src/test/resources/application.properties`).
- 실제 PostgreSQL로 돌리려면 `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` 환경변수로 덮어쓴다.

## 설정 (`src/main/resources/application.yml`)

모두 환경변수로 덮어쓸 수 있고, 기본값은 외부 키 없이 실행되도록 꺼져 있다.

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `APP_AI_ENABLED` | `false` | `true`면 실제 AI 서버 호출(`HttpAiClient`), `false`면 가짜 결과(`StubAiClient`) |
| `APP_AI_BASE_URL` | `http://localhost:8000` | AI 서버 주소. 백엔드가 Docker 안이면 `http://host.docker.internal:8000` |
| `APP_AI_READ_TIMEOUT` | `30s` | AI 응답 대기 한도. 넘으면 반납은 `503` |
| `APP_ADMIN_TOKEN` | (비어 있음) | 배차 재개 API의 `X-Admin-Token`. 비어 있으면 관리자 API는 전부 `401` |
| `APP_S3_ENABLED` | `false` | `true`면 사진을 S3에 업로드 (AWS 자격증명 필요) |
| `APP_DISCORD_ENABLED` | `false` | `true`면 오염 알림을 디스코드 웹훅으로 전송 |
| `APP_UPLOAD_MAX_SIZE` | `20MB` | 반납 사진 업로드 한도 |
| `APP_POLLUTION_WARN_THRESHOLD` / `_BLOCK_THRESHOLD` | `0.02` / `0.05` | 오염 면적 등급 기준 |

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| `POST` | `/return` | 반납 (multipart: `plate`, `image`) |
| `GET` | `/vehicles` | 차량 목록 |
| `GET` | `/vehicles/{plate}` | 차량 상세 + 최근 검수 |
| `POST` | `/vehicles/{plate}/resume` | 배차 재개 (헤더 `X-Admin-Token`) |

요청·응답 형식은 [docs/API.md](../../docs/API.md).

## 코드 구조 (`src/main/java/com/smartfms/backend/`)

```
controller/   API 입구 (URL → 서비스), ApiExceptionHandler: 예외 → HTTP 상태
service/
  InspectionService   반납 처리 전체 흐름 (processReturn), 등급 판정 (judgeGrade)
  DispatchService     오염 차량의 다음 예약 Swap / 차단
  VehicleService      차량 목록·상세 조회, 배차 재개 (resume)
  HttpAiClient        AI 서버 호출          StubAiClient    가짜 AI 결과
  S3ImageStorage      사진 S3 저장          LocalImageStorage 경로만 생성
  DiscordNotifier     디스코드 알림         LogNotifier     로그로 대체
  AdminTokenVerifier  관리자 토큰 검사
domain/       DB 테이블 매핑 + 상태 enum
repository/   DB 조회 (Spring Data JPA)
dto/          API 요청·응답 형태
config/       CORS, S3 클라이언트
```

스키마는 `db/schema.sql`이 기준이고 JPA는 검증(`ddl-auto: validate`)만 한다. 테이블을 바꾸려면 schema.sql을 고친다.
