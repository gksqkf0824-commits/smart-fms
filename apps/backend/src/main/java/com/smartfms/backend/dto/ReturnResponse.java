package com.smartfms.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.dto.AiPredictResponse.PollutionClass;

/**
 * POST /return 응답 — docs/API.md 스펙과 동일.
 * 고객 화면(S3 결과)에 그대로 표시된다.
 */
public record ReturnResponse(
        String vehicle,                 // 차량 번호
        BigDecimal roiPollutionRatio,   // → "roi_pollution_ratio"
        List<PollutionClass> classes,
        Grade grade,                    // NORMAL / WARN / BLOCK
        List<String> actions,           // 실제로 실행된 조치 목록
        String imageKey                 // → "image_key" (S3 경로, URL 아님)
) {
}
