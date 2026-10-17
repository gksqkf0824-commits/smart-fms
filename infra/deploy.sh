#!/usr/bin/env bash
#
# EC2 재배포 스크립트
#
#   사용법:
#     ./infra/deploy.sh            현재 코드로 재배포
#     ./infra/deploy.sh --reset    DB까지 초기화 후 재배포 (스키마 변경 시)
#
#   동작: jar 빌드 → amd64 이미지 생성 → 전송 → EC2에서 교체 → 헬스체크
#
#   전제:
#     - SSH 키가 있고 EC2 보안 그룹에 현재 IP가 허용돼 있을 것
#     - S3는 EC2의 IAM 역할로 인증하므로 자격증명 전달 불필요
set -euo pipefail

# ── 설정 (환경변수로 덮어쓸 수 있음) ───────────────────────────────
EC2_HOST="${EC2_HOST:-3.36.228.255}"
EC2_USER="${EC2_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/fms-key-seoul.pem}"
REMOTE_DIR="${REMOTE_DIR:-~/fms}"
IMAGE="fms-backend:deploy"

RESET_DB=false
[[ "${1:-}" == "--reset" ]] && RESET_DB=true

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

SSH="ssh -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=15 $EC2_USER@$EC2_HOST"

step() { echo; echo "▶ $*"; }

# ── 0. 사전 확인 ──────────────────────────────────────────────────
step "사전 확인"
[[ -f "$SSH_KEY" ]] || { echo "❌ SSH 키를 찾을 수 없습니다: $SSH_KEY"; exit 1; }
$SSH 'true' 2>/dev/null || {
  echo "❌ EC2에 접속할 수 없습니다 ($EC2_HOST)."
  echo "   IP가 바뀌었거나, 보안 그룹의 허용 IP가 현재 IP와 다를 수 있습니다."
  exit 1
}
echo "  브랜치: $(git -C "$REPO_ROOT" branch --show-current) / $(git -C "$REPO_ROOT" log --oneline -1)"

# ── 1. jar 빌드 (호스트 네이티브 — 빠름) ──────────────────────────
step "jar 빌드"
(cd "$REPO_ROOT/apps/backend" && ./gradlew bootJar -q)
JAR=$(ls "$REPO_ROOT"/apps/backend/build/libs/*-SNAPSHOT.jar | head -1)
cp "$JAR" "$WORK/app.jar"
echo "  $(basename "$JAR") ($(du -h "$WORK/app.jar" | cut -f1))"

# ── 2. amd64 이미지 빌드 ──────────────────────────────────────────
step "amd64 이미지 빌드"
cp "$REPO_ROOT/infra/Dockerfile.deploy" "$WORK/Dockerfile"
docker buildx build --platform linux/amd64 -t "$IMAGE" --load "$WORK" >/dev/null
echo "  $IMAGE ($(docker image inspect "$IMAGE" --format '{{.Architecture}}'))"

# ── 3. 압축 ───────────────────────────────────────────────────────
step "이미지 압축"
docker save "$IMAGE" | gzip -1 > "$WORK/image.tar.gz"
echo "  $(du -h "$WORK/image.tar.gz" | cut -f1)"

# ── 4. 전송 ───────────────────────────────────────────────────────
step "EC2로 전송"
$SSH "mkdir -p $REMOTE_DIR"
scp -i "$SSH_KEY" -o BatchMode=yes -q \
    "$REPO_ROOT/infra/docker-compose.deploy.yml" "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$SSH_KEY" -o BatchMode=yes -q -r \
    "$REPO_ROOT/db" "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$SSH_KEY" -o BatchMode=yes \
    "$WORK/image.tar.gz" "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

# ── 5. 교체 ───────────────────────────────────────────────────────
step "컨테이너 교체"
if $RESET_DB; then
  echo "  ⚠️  --reset: DB 볼륨을 삭제하고 스키마를 새로 만듭니다"
  $SSH "cd $REMOTE_DIR && docker compose -f docker-compose.deploy.yml down -v" >/dev/null 2>&1 || true
fi
$SSH "cd $REMOTE_DIR && gunzip -c image.tar.gz | docker load && rm -f image.tar.gz" >/dev/null
$SSH "cd $REMOTE_DIR && docker compose -f docker-compose.deploy.yml up -d" 2>&1 | sed 's/^/  /'
$SSH "docker image prune -f" >/dev/null 2>&1 || true

# ── 6. 확인 ───────────────────────────────────────────────────────
step "헬스체크"
for i in $(seq 1 24); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "http://$EC2_HOST:8080/vehicles" || true)
  if [[ "$CODE" == "200" ]]; then
    echo "  ✅ 배포 성공 — http://$EC2_HOST:8080"
    curl -s -m 10 "http://$EC2_HOST:8080/vehicles" |
      python3 -c "import json,sys; print('  차량', len(json.load(sys.stdin)), '대 응답')" 2>/dev/null || true
    exit 0
  fi
  sleep 5
done

echo "  ❌ 2분 내에 응답하지 않았습니다. 로그를 확인하세요:"
echo "     ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'docker logs fms-backend --tail 50'"
exit 1
