package com.smartfms.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * AI 추론 서버 응답 — docs/API.md의 `POST /predict` 스펙과 동일.
 * 백엔드가 AI를 호출하고, AI는 결과 JSON만 반환한다 (이미지 X).
 */
public record AiPredictResponse(
        BigDecimal roiPollutionRatio,   // 합산 오염도 (0.0~1.0)
        List<PollutionClass> classes,   // 종류별 면적 비율
        BigDecimal confidence
) {
    /** 오염 종류 1건 — type은 `trash`(고형 쓰레기) 또는 `spill`(액체·얼룩) */
    public record PollutionClass(String type, BigDecimal areaRatio) {
    }

    /** 특정 종류의 면적 비율 조회 (없으면 0) */
    public BigDecimal ratioOf(String type) {
        if (classes == null) {
            return BigDecimal.ZERO;
        }
        return classes.stream()
                .filter(c -> type.equals(c.type()))
                .map(PollutionClass::areaRatio)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }
}
