package com.smartfms.backend.dto;

import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GET /vehicles 응답 1건 — docs/API.md 명세와 필드 동일.
 * JSON에서는 snake_case로 직렬화됨 (application.yml의 jackson 설정).
 */
public record VehicleListResponse(
        String plate,
        String zone,
        VehicleStatus status,
        BigDecimal pollutionRatio,   // → "pollution_ratio" (최근 검수의 합산 오염도, 검수 이력 없으면 null)
        LocalDateTime lastChecked    // → "last_checked"    (최근 검수 시각, 없으면 null)
) {
    public static VehicleListResponse of(Vehicle vehicle, Inspection latestInspection) {
        return new VehicleListResponse(
                vehicle.getPlate(),
                vehicle.getZone(),
                vehicle.getStatus(),
                latestInspection != null ? latestInspection.getRoiPollutionRatio() : null,
                latestInspection != null ? latestInspection.getCreatedAt() : null
        );
    }
}
