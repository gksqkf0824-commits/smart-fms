package com.smartfms.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.smartfms.backend.domain.VehicleStatus;

/**
 * GET /vehicles/{plate} 응답 — docs/API.md 스펙 기준.
 * 관제 대시보드 상세 화면(D2): AI 감지 결과 및 실행된 조치를 검증하는 화면.
 */
public record VehicleDetailResponse(
        String plate,
        String zone,
        String model,
        VehicleStatus status,
        LatestInspection latestInspection   // → "latest_inspection" (검수 이력 없으면 null)
) {
    /** 가장 최근 검수 1건 */
    public record LatestInspection(
            BigDecimal spillRatio,          // spill 오염 면적 비율
            int trashCount,                 // 쓰레기 감지 개수
            boolean occupyDetected,         // 소지품/유실물 감지 여부
            String imageUrl,                // presigned URL (S3 미사용 시 null)
            List<String> actions,
            LocalDateTime checkedAt         // → "checked_at"
    ) {
    }
}