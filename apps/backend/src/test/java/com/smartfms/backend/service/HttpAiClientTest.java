package com.smartfms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.smartfms.backend.dto.AiPredictResponse;

class HttpAiClientTest {

    private MockRestServiceServer server;
    private HttpAiClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ai-server:8000");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new HttpAiClient(builder.build());
    }

    @Test
    void 정상_응답을_snake_case_계약대로_매핑한다() {
        server.expect(requestTo("http://ai-server:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.MULTIPART_FORM_DATA))
                .andRespond(withSuccess("""
                        {"roi_pollution_ratio": 0.08, "trash_count": 3, "trash_large": false,
                         "occupy_detected": true, "confidence": 0.91}
                        """, MediaType.APPLICATION_JSON));

        AiPredictResponse result = client.predict(new byte[] {1, 2, 3});

        assertThat(result.roiPollutionRatio()).isEqualByComparingTo("0.08");
        assertThat(result.trashCount()).isEqualTo(3);
        assertThat(result.trashLarge()).isFalse();
        assertThat(result.occupyDetected()).isTrue();
        server.verify();
    }

    @Test
    void no_target_detected는_오염도_0으로_처리한다() {
        server.expect(requestTo("http://ai-server:8000/predict"))
                .andRespond(withSuccess("{\"detail\": \"no_target_detected\"}", MediaType.APPLICATION_JSON));

        AiPredictResponse result = client.predict(new byte[] {1});

        assertThat(result).isEqualTo(new AiPredictResponse(BigDecimal.ZERO, 0, false, false));
    }

    @Test
    void 서버_오류는_AiServerException으로_올린다() {
        server.expect(requestTo("http://ai-server:8000/predict"))
                .andRespond(withServerError().body("{\"detail\": \"inference_failed\"}"));

        assertThatThrownBy(() -> client.predict(new byte[] {1}))
                .isInstanceOf(AiServerException.class);
    }

    @Test
    void 알_수_없는_detail은_AiServerException으로_올린다() {
        server.expect(requestTo("http://ai-server:8000/predict"))
                .andRespond(withSuccess("{\"detail\": \"something_else\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.predict(new byte[] {1}))
                .isInstanceOf(AiServerException.class);
    }
}
