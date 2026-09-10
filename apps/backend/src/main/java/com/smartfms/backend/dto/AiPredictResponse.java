package com.smartfms.backend.dto;

import java.math.BigDecimal;

/**
 * AI 추론 서버 응답 — docs/API.md의 `POST /predict` 스펙.
 * 백엔드가 AI를 호출하고, AI는 결과 JSON만 반환한다 (이미지 X).
 */
public record AiPredictResponse(
        BigDecimal roiPollutionRatio,   // spill_ratio 오염도 (0.000~1.000)
        BigDecimal occupyRatio,         // 소지품 점유 비율 (0.000~1.000)
        Integer trashCount,             // 감지된 쓰레기 개수
        Boolean trashLarge,            // 대형 쓰레기 여부 (ROI 1% 이상)
        Boolean occupyDetected          // 소지품/유실물 감지 여부
) {}