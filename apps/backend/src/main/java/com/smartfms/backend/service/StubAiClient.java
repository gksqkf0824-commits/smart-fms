package com.smartfms.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    @Override
    public AiPredictResponse predict(byte[] image) {
        // 이미지 크기를 씨앗으로 0.00~0.50 범위의 오염도를 생성 (임시)
        int seed = (image == null ? 0 : image.length) % 51;
        BigDecimal total = BigDecimal.valueOf(seed).divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);

        // 오염이 적을 땐 고형 쓰레기만, 많을 땐 액체·얼룩이 섞인 것으로 흉내
        List<PollutionClass> classes;
        if (total.compareTo(new BigDecimal("0.100")) < 0) {
            classes = List.of(new PollutionClass("trash", total));
        } else {
            BigDecimal trash = total.multiply(BigDecimal.valueOf(0.6)).setScale(3, RoundingMode.HALF_UP);
            BigDecimal spill = total.subtract(trash).setScale(3, RoundingMode.HALF_UP);
            classes = List.of(new PollutionClass("trash", trash), new PollutionClass("spill", spill));
        }

        return new AiPredictResponse(total, classes, new BigDecimal("0.900"), new BigDecimal("0.850"));
    }
}
