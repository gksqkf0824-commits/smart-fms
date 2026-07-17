-- =============================================================
-- Smart FMS — 개발용 더미 데이터
-- 시나리오: 이용자가 오염 반납 → BLOCK 판정 → 배차 차단 + 세차 요청 + 패널티
-- (docs/API.md의 /return 예시 값과 동일한 수치 사용)
-- =============================================================

-- 이용자
INSERT INTO users (name, phone, penalty_points) VALUES
    ('홍길동', '010-1111-2222', 5),
    ('김철수', '010-3333-4444', 0);

-- 차량
INSERT INTO vehicles (plate, model, zone, status) VALUES
    ('12가3456', '아이오닉 5', '강남 A존', 'CARWASH_NEEDED'),
    ('34나5678', '레이',      '강남 B존', 'AVAILABLE'),
    ('56다7890', '아이오닉 5', '강남 A존', 'AVAILABLE');

-- 반납 검수: 12가3456이 오염 20%로 BLOCK 판정 (trash 12% + spill 8%)
INSERT INTO inspections (vehicle_id, user_id, roi_pollution_ratio, trash_ratio, spill_ratio, grade, iou, image_key)
VALUES (1, 1, 0.200, 0.120, 0.080, 'BLOCK', 0.860, 'inspections/2026/12가3456_0941.jpg');

-- 배차 이력: 홍길동의 배차가 차단(BLOCKED)되고 34나5678로 Swap
INSERT INTO dispatches (vehicle_id, user_id, status, swapped_to) VALUES
    (1, 1, 'BLOCKED', 2),
    (2, 1, 'IN_USE',  NULL),
    (3, 2, 'RETURNED', NULL);

-- 세차 요청: 위 검수(1번)가 트리거
INSERT INTO carwash_requests (vehicle_id, inspection_id, partner, status)
VALUES (1, 1, '강남 세차연합', 'REQUESTED');

-- 패널티: 직전 이용자 홍길동에게 부과
INSERT INTO penalties (user_id, inspection_id, points, reason)
VALUES (1, 1, 5, '오염도 20% (WARN 초과)');
