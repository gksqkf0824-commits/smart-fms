package com.smartfms.backend.service;

/** 관리자 토큰이 없거나 틀린 경우 — 401로 응답 */
public class AdminAuthException extends RuntimeException {

    public AdminAuthException() {
        super("관리자 인증이 필요합니다.");
    }
}
