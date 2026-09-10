-- =============================================================
-- Smart FMS — PostgreSQL 스키마 (최종 반영본)
-- 기준 문서: docs/ERD.md & docs/API.md
-- enum 값은 docs/API.md 표와 철자·대소문자 동일 (CHECK 제약으로 강제)
-- =============================================================

-- 재실행 대비: 역순 DROP (FK 의존 순서 주의)
DROP TABLE IF EXISTS penalties;
DROP TABLE IF EXISTS carwash_requests;
DROP TABLE IF EXISTS dispatches;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------------
-- 1. users — 이용자
-- -------------------------------------------------------------
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50)  NOT NULL,
    phone           VARCHAR(20),
    penalty_points  INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 2. vehicles — 차량
-- -------------------------------------------------------------
CREATE TABLE vehicles (
    id          BIGSERIAL PRIMARY KEY,
    plate       VARCHAR(20)  NOT NULL UNIQUE,          -- 예: 12가3456
    model       VARCHAR(50),
    zone        VARCHAR(50),                            -- 예: 강남 A존
    status      VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                CHECK (status IN ('AVAILABLE', 'INSPECTING', 'CARWASH_NEEDED')),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- 3. inspections — 반납 검수 (핵심 테이블, 반납 1건 = 1행)
-- -------------------------------------------------------------
CREATE TABLE inspections (
    id                  BIGSERIAL PRIMARY KEY,
    vehicle_id          BIGINT       NOT NULL REFERENCES vehicles(id),
    user_id             BIGINT       REFERENCES users(id),   -- 반납한 직전 이용자
    
    -- Segmentation (면적 비율)
    spill_ratio         NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (spill_ratio BETWEEN 0 AND 1), -- 복원된 spill_ratio (오염 면적)
    roi_pollution_ratio NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (roi_pollution_ratio BETWEEN 0 AND 1), -- spill_ratio 동일값/호환용
    occupy_ratio        NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (occupy_ratio BETWEEN 0 AND 1),
    
    -- Detection (쓰레기 개수 및 소지품 감지)
    trash_count         INT          NOT NULL DEFAULT 0,     -- 쓰레기 감지 개수
    trash_large         BOOLEAN      NOT NULL DEFAULT FALSE, -- 대형 쓰레기 여부 (ROI 1% 이상)
    occupy_detected     BOOLEAN      NOT NULL DEFAULT FALSE, -- 소지품/유실물 감지 여부
    
    -- 판정 결과 및 알림
    grade               VARCHAR(10)  NOT NULL
                        CHECK (grade IN ('NORMAL', 'WARN', 'BLOCK')),
    user_alert          BOOLEAN      NOT NULL DEFAULT FALSE, -- 유실물 안내 발송 여부
    
    image_key           VARCHAR(255),                        -- S3 경로 문자열만 저장 (BLOB 금지)
    created_at          TIMESTAMP    NOT NULL DEFAULT now()
);

-- 차량 상세(D2)에서 "최근 검수" 조회용
CREATE INDEX idx_inspections_vehicle_created
    ON inspections (vehicle_id, created_at DESC);

-- -------------------------------------------------------------
-- 4. dispatches — 배차 이력 (+ 차단/Swap 기록)
-- -------------------------------------------------------------
CREATE TABLE dispatches (
    id          BIGSERIAL PRIMARY KEY,
    vehicle_id  BIGINT      NOT NULL REFERENCES vehicles(id),
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'RESERVED'
                CHECK (status IN ('RESERVED', 'IN_USE', 'RETURNED', 'BLOCKED', 'SWAPPED')),
    swapped_to  BIGINT      REFERENCES vehicles(id),   -- Swap된 경우 대체 차량
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatches_vehicle ON dispatches (vehicle_id);
CREATE INDEX idx_dispatches_user    ON dispatches (user_id);

-- -------------------------------------------------------------
-- 5. carwash_requests — 세차 요청 (오염도 초과 시 자동 호출 기록)
-- -------------------------------------------------------------
CREATE TABLE carwash_requests (
    id             BIGSERIAL PRIMARY KEY,
    vehicle_id     BIGINT      NOT NULL REFERENCES vehicles(id),
    inspection_id  BIGINT      NOT NULL REFERENCES inspections(id),
    partner        VARCHAR(50),                        -- 예: 강남 세차연합
    status         VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
                   CHECK (status IN ('REQUESTED', 'DONE')),
    created_at     TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_carwash_vehicle ON carwash_requests (vehicle_id);

-- -------------------------------------------------------------
-- 6. penalties — 패널티 내역 (오염 반납 시 직전 이용자에게 부과)
-- -------------------------------------------------------------
CREATE TABLE penalties (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id),
    inspection_id  BIGINT       NOT NULL REFERENCES inspections(id),
    points         INT          NOT NULL,
    reason         VARCHAR(100),                       -- 예: 오염도(spill) 8%, 쓰레기 3개
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_penalties_user ON penalties (user_id);