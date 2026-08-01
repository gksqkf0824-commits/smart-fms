package com.smartfms.backend.service;

import com.smartfms.backend.dto.AiPredictResponse;

/**
 * AI 추론 서버(FastAPI) 호출 창구.
 * 4주차에 실제 HTTP 호출 구현체로 교체하면 되고, 나머지 코드는 손대지 않아도 된다.
 */
public interface AiClient {

    /** 실내 사진 1장을 분석해 오염도 결과를 받는다 (docs/API.md `POST /predict`) */
    AiPredictResponse predict(byte[] image);
}
