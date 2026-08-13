package com.smartfms.backend.service;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.smartfms.backend.domain.Grade;

/**
 * 디스코드 웹훅 미설정 시의 기본 구현 (로그로 대체).
 * 웹훅 URL 없는 팀원도 백엔드를 그대로 띄울 수 있게 하기 위함.
 */
@Component
@ConditionalOnProperty(name = "app.discord.enabled", havingValue = "false", matchIfMissing = true)
public class LogNotifier implements Notifier {

    private static final Logger log = LoggerFactory.getLogger(LogNotifier.class);

    @Override
    public void notify(String plate, BigDecimal ratio, Grade grade, boolean dispatchSuspended) {
        if (dispatchSuspended) {
            log.warn("[오염 감지] 차량={} 오염도={} 등급={} (자동배차 중지됨)", plate, ratio, grade);
        } else {
            log.warn("[오염 감지] 차량={} 오염도={} 등급={}", plate, ratio, grade);
        }
    }
}
