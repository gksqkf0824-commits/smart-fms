package com.smartfms.backend.dto;

import java.math.BigDecimal;

/**
 * POST /api/v1/inspections 요청 바디 (AI 서버 -> 백엔드)
 */
public record InspectionCreateRequest(
        Long vehicleId,
        Long userId,
        BigDecimal pollutionRatio, // AI 오염도 측정값 (예: 0.15)
        String rawAiResultUrl
) {
}