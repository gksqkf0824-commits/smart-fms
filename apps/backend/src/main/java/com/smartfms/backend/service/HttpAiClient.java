package com.smartfms.backend.service;

import java.math.BigDecimal;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartfms.backend.dto.AiPredictResponse;

/**
 * 실제 AI 추론 서버(FastAPI, apps/ai-server) 호출 — app.ai.enabled=true 일 때만 사용.
 * 꺼져 있으면 StubAiClient가 대신 동작한다.
 *
 * 오염 판정이 불가능한 상태에서 반납을 NORMAL로 통과시키면 안 되므로,
 * 호출 실패는 흡수하지 않고 AiServerException으로 올려 반납 처리 전체를 실패시킨다.
 */
@Component
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
public class HttpAiClient implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(HttpAiClient.class);

    /** 아무것도 감지 못 했을 때 AI 서버가 200으로 내려주는 값 (docs/API.md 1번) */
    static final String NO_TARGET_DETECTED = "no_target_detected";

    private final RestClient restClient;

    @Autowired
    public HttpAiClient(@Value("${app.ai.base-url}") String baseUrl,
                        @Value("${app.ai.connect-timeout}") Duration connectTimeout,
                        @Value("${app.ai.read-timeout}") Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /** 테스트용 — MockRestServiceServer를 붙인 RestClient 주입 */
    HttpAiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public AiPredictResponse predict(byte[] image) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new ByteArrayResource(image) {
            // FastAPI(UploadFile)는 filename이 없는 파트를 파일로 인식하지 않는다
            @Override
            public String getFilename() {
                return "image.jpg";
            }
        });

        PredictBody result;
        try {
            result = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(PredictBody.class);
        } catch (RestClientException e) {
            throw new AiServerException("AI 서버 호출 실패", e);
        }

        if (result == null) {
            throw new AiServerException("AI 서버 응답이 비어 있습니다.");
        }

        // 오염 요소를 하나도 못 찾음 → 오염도 0으로 처리 (백엔드 판정 시 NORMAL)
        if (NO_TARGET_DETECTED.equals(result.detail())) {
            return new AiPredictResponse(BigDecimal.ZERO, 0, false, false);
        }
        if (result.detail() != null || result.roiPollutionRatio() == null) {
            throw new AiServerException("예상하지 못한 AI 서버 응답: detail=" + result.detail());
        }

        log.debug("[AI 추론] spill={} trash={} large={} occupy={} confidence={}",
                result.roiPollutionRatio(), result.trashCount(), result.trashLarge(),
                result.occupyDetected(), result.confidence());

        return new AiPredictResponse(
                result.roiPollutionRatio(),
                result.trashCount(),
                result.trashLarge(),
                result.occupyDetected()
        );
    }

    /**
     * AI 서버 응답 원본. 정상 응답과 `{"detail": "no_target_detected"}`를 모두 받을 수 있게 필드를 전부 nullable로 둔다.
     * 필드명은 전역 naming 설정과 무관하게 계약(snake_case) 그대로 고정.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record PredictBody(
            @JsonProperty("roi_pollution_ratio") BigDecimal roiPollutionRatio,
            @JsonProperty("trash_count") Integer trashCount,
            @JsonProperty("trash_large") Boolean trashLarge,
            @JsonProperty("occupy_detected") Boolean occupyDetected,
            @JsonProperty("confidence") BigDecimal confidence,
            @JsonProperty("detail") String detail
    ) {}
}
