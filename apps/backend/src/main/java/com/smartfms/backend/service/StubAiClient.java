package com.smartfms.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.smartfms.backend.dto.AiPredictResponse;

/**
 * AI 서버가 아직 없는 동안 쓰는 임시 구현 (4주차 AI↔BE 연동 시 교체).
 * 이미지 바이트로부터 결정적인 값을 만들어 내므로, 같은 사진은 항상 같은 결과가 나온다
 * → 시연·테스트 재현성 확보.
 */
@Component
public class StubAiClient implements AiClient {

    /** 소지품이 감지됐을 때의 면적 비율 (임시 고정값) */
    private static final BigDecimal OCCUPY_AREA = new BigDecimal("0.020");

    /**
     * 테스트 방법 — 파일 크기(바이트 수)로 결과를 조절할 수 있다.
     *   - spill 오염도(roiPollutionRatio) = (바이트 수 % 10) / 100  (예: 5바이트 -> 5%)
     *   - 쓰레기 개수(trashCount) = (바이트 수 % 5)  (예: 3개 감지)
     *   - 대형 쓰레기(trashLarge) = 쓰레기가 3개 이상일 때 true
     *   - 소지품 감지(occupyDetected) = 바이트 수가 홀수일 때 true
     */
    @Override
    public AiPredictResponse predict(byte[] image) {
        int length = image == null ? 0 : image.length;

        // spill 오염도 비율 (0.000 ~ 0.090)
        BigDecimal spillRatio = BigDecimal.valueOf(length % 10)
                .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);

        // 쓰레기 개수 및 대형 여부
        int trashCount = length % 5;
        boolean trashLarge = trashCount >= 3;

        // 소지품 감지 여부 및 면적
        boolean occupyDetected = (length % 2 == 1);
        BigDecimal occupyRatio = occupyDetected ? OCCUPY_AREA : BigDecimal.ZERO;

        return new AiPredictResponse(
                spillRatio,       // roiPollutionRatio (spill_ratio)
                occupyRatio,      // occupyRatio
                trashCount,       // trashCount
                trashLarge,       // trashLarge
                occupyDetected    // occupyDetected
        );
    }
}