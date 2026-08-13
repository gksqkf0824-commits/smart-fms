package com.smartfms.backend.service;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.smartfms.backend.domain.Grade;

/**
 * 오염 감지 알림 — 디스코드 웹훅 전송.
 * 알림 전송 실패가 반납 처리(트랜잭션) 전체를 롤백시키면 안 되므로 예외를 여기서 흡수한다.
 */
@Component
@ConditionalOnProperty(name = "app.discord.enabled", havingValue = "true")
public class DiscordNotifier implements Notifier {

    private static final Logger log = LoggerFactory.getLogger(DiscordNotifier.class);

    private final RestClient restClient;
    private final String webhookUrl;

    public DiscordNotifier(@Value("${app.discord.webhook-url}") String webhookUrl) {
        this.restClient = RestClient.create();
        this.webhookUrl = webhookUrl;
    }

    @Override
    public void notify(String plate, BigDecimal ratio, Grade grade, boolean dispatchSuspended) {
        String content = buildMessage(plate, ratio, grade, dispatchSuspended);

        try {
            restClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new DiscordMessage(content))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("[디스코드 알림 실패] 차량={} 등급={}", plate, grade, e);
        }
    }

    private String buildMessage(String plate, BigDecimal ratio, Grade grade, boolean dispatchSuspended) {
        String emoji = grade == Grade.BLOCK ? "🚨" : "⚠️";
        int percent = ratio.multiply(BigDecimal.valueOf(100)).intValue();

        String message = "%s **오염 감지** — 차량 `%s`\n오염도 %d%% · 등급 %s"
                .formatted(emoji, plate, percent, grade);

        if (dispatchSuspended) {
            message += "\n⛔ **자동배차 중지** — 오염도 %d%%로 %s 등급 기준을 초과해 다음 예약을 다른 차량으로 대체했습니다."
                    .formatted(percent, grade);
        }
        return message;
    }

    private record DiscordMessage(String content) {
    }
}
