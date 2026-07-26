# =============================================================
# Smart FMS 백엔드 이미지 — 멀티스테이지 빌드
#   1단계(builder): JDK + Gradle로 jar를 굽는 "공장"
#   2단계(runtime): 완성된 jar만 담는 "배송 상자" (JRE만, 가벼움)
# 공장은 배송하지 않는다 → 최종 이미지엔 빌드 도구가 안 들어감
# =============================================================

# ---------- 1단계: 빌드 ----------
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# 빌드 설정 파일만 먼저 복사 → 의존성 다운로드를 별도 레이어로 캐시
# (소스 코드만 바뀌면 이 레이어는 재사용돼서 빌드가 훨씬 빨라짐)
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon || true

# 소스 복사 후 실행 가능한 jar(bootJar) 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon

# ---------- 2단계: 실행 ----------
# JRE만 있는 이미지 — 컴파일러(JDK)는 실행에 필요 없음
FROM eclipse-temurin:21-jre
WORKDIR /app

# 보안: root 대신 전용 계정으로 실행 (컨테이너가 뚫려도 권한 최소화)
RUN useradd --system --no-create-home spring
USER spring

# builder 단계에서 만든 jar만 가져옴
COPY --from=builder /app/build/libs/*.jar app.jar

# 문서용 표기 — 실제 포트 개방은 docker-compose의 ports가 담당
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
