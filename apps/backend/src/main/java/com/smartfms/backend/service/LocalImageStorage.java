package com.smartfms.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * S3를 쓰지 않을 때의 기본 구현 (경로만 생성, 실제 업로드 없음).
 * AWS 자격증명이 없는 팀원도 백엔드를 그대로 띄울 수 있게 하기 위함.
 */
@Component
@ConditionalOnProperty(name = "app.s3.enabled", havingValue = "false", matchIfMissing = true)
public class LocalImageStorage implements ImageStorage {

    @Override
    public String store(byte[] image, String plate) {
        return buildKey(plate);
    }

    @Override
    public String presignedUrl(String key) {
        // S3 미사용 시에는 발급할 링크가 없음
        return null;
    }

    /**
     * S3 저장 경로 규칙 — 예: inspections/2026/12가3456_094103_a1b2c3d4.jpg
     * 같은 차량이 같은 초 안에 반납돼도 키가 겹치지 않도록 UUID 접미사를 붙인다.
     */
    static String buildKey(String plate) {
        LocalDateTime now = LocalDateTime.now();
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        return "inspections/%d/%s_%s_%s.jpg".formatted(
                now.getYear(), plate, now.format(DateTimeFormatter.ofPattern("HHmmss")), uniqueSuffix);
    }
}
