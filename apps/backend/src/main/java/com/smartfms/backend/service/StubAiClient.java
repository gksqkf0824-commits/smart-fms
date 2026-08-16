package com.smartfms.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.smartfms.backend.dto.AiPredictResponse;
import com.smartfms.backend.dto.AiPredictResponse.PollutionClass;

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
     * 테스트 방법 — 파일 크기로 결과를 조절할 수 있다.
     *   쓰레기 비율 = (바이트 수 % 51) / 100   예) 45바이트 → 45%
     *   소지품 감지 = 바이트 수가 홀수일 때     예) 45바이트 → 감지됨 / 44바이트 → 없음
     */
    @Override
    public AiPredictResponse predict(byte[] image) {
        int length = image == null ? 0 : image.length;

        BigDecimal trashRatio = BigDecimal.valueOf(length % 51)
                .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);

        List<PollutionClass> classes = new ArrayList<>();
        if (trashRatio.compareTo(BigDecimal.ZERO) > 0) {
            classes.add(new PollutionClass("trash", trashRatio));
        }
        if (length % 2 == 1) {
            classes.add(new PollutionClass("occupy", OCCUPY_AREA));
        }

        // 오염도는 쓰레기 기준 — 소지품은 오염이 아니라 별도 조치(고객 알림) 대상
        return new AiPredictResponse(trashRatio, classes, new BigDecimal("0.900"));
    }
}
