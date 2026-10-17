package com.smartfms.backend.service;

import com.smartfms.backend.dto.AiPredictResponse;

/**
 * AI 추론 서버(FastAPI) 호출 창구.
 * app.ai.enabled=true → HttpAiClient (실제 호출), false(기본) → StubAiClient.
 */
public interface AiClient {

    /** 실내 사진 1장을 분석해 오염도 결과를 받는다 (docs/API.md `POST /predict`) */
    AiPredictResponse predict(byte[] image);
}
