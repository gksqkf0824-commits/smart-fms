# 인프라 · 배포

담당: 김민아

## 서버

| 항목 | 값 |
|---|---|
| 주소 | `http://3.36.228.255:8080` (탄력적 IP — 재시작해도 고정) |
| 스펙 | EC2 t3.micro · Ubuntu · 메모리 908MB + 스왑 1GB |
| 구성 | Docker Compose로 PostgreSQL + 백엔드 |
| S3 인증 | EC2 IAM 역할(`smart-fms-ec2-role`) — **서버에 자격증명 파일 없음** |

접속은 보안 그룹에서 **허용된 IP만** 가능합니다(8080·22). IP가 바뀌었거나 새 팀원이
접속해야 하면 EC2 → 보안 그룹 → 인바운드 규칙에 추가하세요.

## 재배포

```bash
./infra/deploy.sh            # 현재 코드로 재배포
./infra/deploy.sh --reset    # DB까지 초기화 (db/schema.sql 변경 시)
```

약 1분 걸리며, 끝에 헬스체크까지 자동으로 확인합니다.

**`--reset`이 필요한 경우:** `db/schema.sql`을 고쳤을 때. 초기화 스크립트는 DB가
처음 만들어질 때만 실행되므로, 기존 볼륨이 남아 있으면 새 스키마가 반영되지 않습니다.
데이터가 지워지고 `db/seed.sql` 상태로 돌아갑니다.

## 배포가 하는 일

```
jar 빌드(맥 네이티브) → amd64 이미지 생성 → 압축·전송 → EC2에서 교체 → 헬스체크
```

맥은 arm64, EC2는 amd64라 아키텍처가 다릅니다. 컨테이너 안에서 Gradle까지 돌리면
에뮬레이션 때문에 매우 느려서, **jar는 맥에서 네이티브로 빌드하고 amd64 이미지에는
복사만** 합니다 (jar는 아키텍처 무관). 서버 메모리가 908MB라 EC2에서 직접 빌드하는 것도
어렵습니다.

## 파일

| 파일 | 용도 |
|---|---|
| `deploy.sh` | 재배포 스크립트 |
| `Dockerfile.deploy` | 배포용 이미지 (미리 빌드한 jar를 복사) |
| `docker-compose.deploy.yml` | EC2에서 실행되는 구성 |

로컬 개발용은 루트의 `docker-compose.yml`과 `apps/backend/Dockerfile`을 씁니다.
배포용과 다른 점은 DB 포트를 외부에 열지 않고, JVM 힙을 제한하고, S3를 켠다는 것입니다.

## 문제가 생기면

```bash
ssh -i ~/.ssh/fms-key-seoul.pem ubuntu@3.36.228.255
docker logs fms-backend --tail 50
docker compose -f ~/fms/docker-compose.deploy.yml ps
free -h                     # 메모리·스왑 상태
```

메모리가 빠듯한 서버라 스왑을 쓰기 시작하면 느려집니다. AI 서버를 같은 인스턴스에
올리려면 타입 업그레이드(t3.small 이상)가 필요합니다.
