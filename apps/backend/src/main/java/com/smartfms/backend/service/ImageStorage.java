package com.smartfms.backend.service;

/**
 * 검수 사진 저장소.
 * DB에는 언제나 경로(key)만 저장하고, 조회 시 만료되는 임시 링크를 발급한다
 * (docs/AGREEMENTS.md 3번 — 이미지 바이너리 DB 저장 금지).
 */
public interface ImageStorage {

    /** 사진을 저장하고 경로(key)를 반환 */
    String store(byte[] image, String plate);

    /** 경로로 임시 접근 URL(presigned) 발급 — 대시보드 상세 조회용 */
    String presignedUrl(String key);
}
