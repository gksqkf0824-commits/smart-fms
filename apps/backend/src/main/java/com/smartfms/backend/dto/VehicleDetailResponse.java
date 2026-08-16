package com.smartfms.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.AiPredictResponse.PollutionClass;

/**
 * GET /vehicles/{plate} 응답 — docs/API.md 스펙과 동일.
 * 관제 대시보드 상세 화면(D2): AI가 무엇을 보고 어떤 조치를 했는지 검증하는 화면.
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
            BigDecimal roiPollutionRatio,
            List<PollutionClass> classes,
            String imageUrl,                // → "image_url" (presigned URL, S3 미사용 시 null)
            List<String> actions,
            LocalDateTime checkedAt         // → "checked_at"
    ) {
    }
}
