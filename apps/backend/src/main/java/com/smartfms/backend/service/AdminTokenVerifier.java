package com.smartfms.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 관리자 전용 API 인증 — 요청 헤더 X-Admin-Token을 app.admin.token과 비교한다.
 * 토큰이 설정되지 않았으면 관리자 API는 전부 거절 (기본값으로 열리지 않게).
 */
@Component
public class AdminTokenVerifier {

    public static final String HEADER = "X-Admin-Token";

    private static final Logger log = LoggerFactory.getLogger(AdminTokenVerifier.class);

    private final byte[] expected;

    public AdminTokenVerifier(@Value("${app.admin.token:}") String token) {
        this.expected = token.getBytes(StandardCharsets.UTF_8);
        if (token.isBlank()) {
            log.warn("[관리자 인증] APP_ADMIN_TOKEN 미설정 — 관리자 API가 모두 401로 거절됩니다.");
        }
    }

    public void verify(String token) {
        if (expected.length == 0 || token == null
                // 응답 시간으로 토큰을 추측하지 못하도록 고정 시간 비교
                || !MessageDigest.isEqual(expected, token.getBytes(StandardCharsets.UTF_8))) {
            throw new AdminAuthException();
        }
    }
}
