package com.smartfms.backend.service;

/** AI 추론 서버 호출 실패 (연결 불가·타임아웃·오류 응답) — 503으로 응답 */
public class AiServerException extends RuntimeException {

    public AiServerException(String message) {
        super(message);
    }

    public AiServerException(String message, Throwable cause) {
        super(message, cause);
    }
}
